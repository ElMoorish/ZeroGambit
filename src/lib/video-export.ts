import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * FFmpeg WASM Video Export Service
 * 
 * Handles video transcoding and export in the browser using FFmpeg.wasm.
 * Supports: WebM → MP4, adding watermarks, compression
 */

export interface ExportOptions {
    format: 'mp4' | 'webm';
    quality: 'high' | 'medium' | 'low';
    watermark?: boolean;
    watermarkText?: string;
    onProgress?: (progress: number) => void;
    onLog?: (message: string) => void;
}

export interface ExportResult {
    success: boolean;
    blob?: Blob;
    url?: string;
    error?: string;
    duration?: number;
}

// Quality presets
const QUALITY_PRESETS = {
    high: { crf: 18, preset: 'slow' },
    medium: { crf: 23, preset: 'medium' },
    low: { crf: 28, preset: 'fast' },
};

class VideoExportService {
    private ffmpeg: FFmpeg | null = null;
    private isLoaded = false;
    private isLoading = false;

    /**
     * Initialize and load FFmpeg WASM
     */
    async load(onLog?: (message: string) => void): Promise<boolean> {
        if (this.isLoaded) return true;
        if (this.isLoading) {
            // Wait for existing load to complete
            while (this.isLoading) {
                await new Promise(r => setTimeout(r, 100));
            }
            return this.isLoaded;
        }

        this.isLoading = true;

        try {
            this.ffmpeg = new FFmpeg();

            // Set up logging
            if (onLog) {
                this.ffmpeg.on('log', ({ message }) => {
                    onLog(message);
                });
            }

            // Load FFmpeg core from CDN
            const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

            await this.ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            this.isLoaded = true;
            this.isLoading = false;
            console.log('✅ FFmpeg WASM loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Export video from canvas or blob
     */
    async export(
        inputData: Blob | Uint8Array,
        inputName: string,
        options: ExportOptions
    ): Promise<ExportResult> {
        const startTime = Date.now();

        try {
            // Ensure FFmpeg is loaded
            if (!await this.load(options.onLog)) {
                return { success: false, error: 'Failed to load FFmpeg' };
            }

            if (!this.ffmpeg) {
                return { success: false, error: 'FFmpeg not initialized' };
            }

            const ffmpeg = this.ffmpeg;
            const quality = QUALITY_PRESETS[options.quality];
            const outputName = `output.${options.format}`;

            // Set up progress tracking
            if (options.onProgress) {
                ffmpeg.on('progress', ({ progress }) => {
                    options.onProgress!(Math.round(progress * 100));
                });
            }

            // Write input file
            options.onLog?.('Writing input file...');
            if (inputData instanceof Blob) {
                await ffmpeg.writeFile(inputName, await fetchFile(inputData));
            } else {
                await ffmpeg.writeFile(inputName, inputData);
            }

            // Build FFmpeg command
            const args: string[] = ['-i', inputName];

            // Video codec settings
            if (options.format === 'mp4') {
                args.push(
                    '-c:v', 'libx264',
                    '-crf', quality.crf.toString(),
                    '-preset', quality.preset,
                    '-pix_fmt', 'yuv420p'
                );
            } else {
                args.push(
                    '-c:v', 'libvpx-vp9',
                    '-crf', quality.crf.toString(),
                    '-b:v', '0'
                );
            }

            // Audio codec (if present)
            args.push('-c:a', 'aac', '-b:a', '128k');

            // Add watermark filter if requested
            if (options.watermark && options.watermarkText) {
                args.push(
                    '-vf',
                    `drawtext=text='${options.watermarkText}':fontcolor=white:fontsize=24:x=w-tw-20:y=h-th-20:shadowcolor=black:shadowx=2:shadowy=2`
                );
            }

            args.push(outputName);

            // Execute transcoding
            options.onLog?.('Starting transcoding...');
            await ffmpeg.exec(args);

            // Read output file
            options.onLog?.('Reading output file...');
            const data = await ffmpeg.readFile(outputName);

            const mimeType = options.format === 'mp4' ? 'video/mp4' : 'video/webm';
            // Convert FileData to ArrayBuffer for Blob constructor
            const uint8Data = data as Uint8Array;
            const arrayBuffer = uint8Data.buffer.slice(uint8Data.byteOffset, uint8Data.byteOffset + uint8Data.byteLength) as ArrayBuffer;
            const blob = new Blob([arrayBuffer], { type: mimeType });
            const url = URL.createObjectURL(blob);

            // Cleanup
            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);

            const duration = Date.now() - startTime;
            options.onLog?.(`Export complete in ${(duration / 1000).toFixed(1)}s`);

            return {
                success: true,
                blob,
                url,
                duration,
            };
        } catch (error) {
            console.error('Export failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Export from a canvas element (for Remotion rendering)
     */
    async exportFromFrames(
        frames: ImageData[],
        options: ExportOptions & { fps: number; width: number; height: number }
    ): Promise<ExportResult> {
        try {
            if (!await this.load(options.onLog)) {
                return { success: false, error: 'Failed to load FFmpeg' };
            }

            if (!this.ffmpeg) {
                return { success: false, error: 'FFmpeg not initialized' };
            }

            const ffmpeg = this.ffmpeg;

            // Write frames as images
            options.onLog?.('Writing frames...');
            for (let i = 0; i < frames.length; i++) {
                const canvas = document.createElement('canvas');
                canvas.width = options.width;
                canvas.height = options.height;
                const ctx = canvas.getContext('2d')!;
                ctx.putImageData(frames[i], 0, 0);

                const blob = await new Promise<Blob>((resolve) => {
                    canvas.toBlob((b) => resolve(b!), 'image/png');
                });

                await ffmpeg.writeFile(`frame${i.toString().padStart(5, '0')}.png`, await fetchFile(blob));
                options.onProgress?.(Math.round((i / frames.length) * 50));
            }

            // Build video from frames
            const quality = QUALITY_PRESETS[options.quality];
            const outputName = `output.${options.format}`;

            const args = [
                '-framerate', options.fps.toString(),
                '-i', 'frame%05d.png',
                '-c:v', options.format === 'mp4' ? 'libx264' : 'libvpx-vp9',
                '-crf', quality.crf.toString(),
                '-pix_fmt', 'yuv420p',
                outputName
            ];

            options.onLog?.('Encoding video...');
            ffmpeg.on('progress', ({ progress }) => {
                options.onProgress?.(50 + Math.round(progress * 50));
            });

            await ffmpeg.exec(args);

            const data = await ffmpeg.readFile(outputName);
            const mimeType = options.format === 'mp4' ? 'video/mp4' : 'video/webm';
            // Convert FileData to ArrayBuffer for Blob constructor
            const uint8Data = data as Uint8Array;
            const arrayBuffer = uint8Data.buffer.slice(uint8Data.byteOffset, uint8Data.byteOffset + uint8Data.byteLength) as ArrayBuffer;
            const blob = new Blob([arrayBuffer], { type: mimeType });
            const url = URL.createObjectURL(blob);

            // Cleanup frames
            for (let i = 0; i < frames.length; i++) {
                await ffmpeg.deleteFile(`frame${i.toString().padStart(5, '0')}.png`);
            }
            await ffmpeg.deleteFile(outputName);

            return { success: true, blob, url };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Convert WebM to MP4
     */
    async webmToMp4(
        webmBlob: Blob,
        options: Omit<ExportOptions, 'format'> = { quality: 'medium' }
    ): Promise<ExportResult> {
        return this.export(webmBlob, 'input.webm', { ...options, format: 'mp4' });
    }

    /**
     * Check if FFmpeg is loaded
     */
    get loaded(): boolean {
        return this.isLoaded;
    }
}

// Singleton instance
export const videoExportService = new VideoExportService();

// Convenience functions
export async function exportVideo(
    input: Blob | Uint8Array,
    inputName: string,
    options: ExportOptions
): Promise<ExportResult> {
    return videoExportService.export(input, inputName, options);
}

export async function convertWebmToMp4(
    webmBlob: Blob,
    onProgress?: (progress: number) => void
): Promise<ExportResult> {
    return videoExportService.webmToMp4(webmBlob, { quality: 'medium', onProgress });
}
