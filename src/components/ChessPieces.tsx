
import React from 'react';

type PieceProps = {
    className?: string;
    style?: React.CSSProperties;
};

export const WhitePawn = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="white" stroke="black" strokeWidth="1.5">
        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
    </svg>
);

export const WhiteKnight = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="white" stroke="black" strokeWidth="1.5">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
        <path d="M24 18c.38 2.32-4.68 1.97-5 0 .38-2.32 4.68-1.97 5 0zM9 26c0 2 1.5 2 2.5 4 1 2.5 1.5 4.5 2.5 6.5 1 2 3.5 1 4.5.5 1-.5.5-2.5 1-4 .5-1.5 2-4 3-5 .5-.5-.5-1.5-.5-2.5 0-3.5 1.5-6.5 3.5-9 1-1.25 3-2.5 3-4 0-1.5-1.5-3.5-3.5-3.5-4 0-7.5 4-8.5 4.5-.5.25-1 .5-2.5.5-1 0-1.5-.5-2-.5-1 0-2.5 1-2.5 2.5 0 2 1 3.5 1 4.5.5 1.5 1 3 .5 3.5-2 .5-4 2.5-4.5 4-.5 1.5 0 3 0 3z" />
    </svg>
);

export const WhiteBishop = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="white" stroke="black" strokeWidth="1.5">
        <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 36c3.39-.97 9.11-1.45 13.5-1.45 4.38 0 10.11.48 13.5 1.45" />
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" fill="#fff" />
        </g>
        <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" strokeLinejoin="miter" />
    </svg>
);

export const WhiteRook = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="white" stroke="black" strokeWidth="1.5">
        <g fill="#fff" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt" />
            <path d="M34 14l-3 3H14l-3-3" />
            <path d="M31 17v12.5c0 2.75-2.25 5-5 5h-7c-2.75 0-5-2.25-5-5V17" />
            <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
            <path d="M11 14h23" fill="none" strokeLinejoin="miter" />
        </g>
    </svg>
);

export const WhiteQueen = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="white" stroke="black" strokeWidth="1.5">
        <g fill="#fff" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM10.5 19.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM38.5 19.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z" />
            <path d="M9 26c0 2 1.5 2 2.5 4 1 2.5 1.5 4.5 2.5 6.5 1 2 3.5 1 4.5.5 1-.5.5-2.5 1-4 .5-1.5 2-4 3-5" />
            <path d="M36 26c0 2-1.5 2-2.5 4-1 2.5-1.5 4.5-2.5 6.5-1 2-3.5 1-4.5.5-1-.5-.5-2.5-1-4-.5-1.5-2-4-3-5" />
            <path d="M9 26c0-1.5 1.5-2 2.5-2 1 0 1.5.5 2.5 1-1.5-1-4-1-5 1z" strokeLinecap="butt" />
            <path d="M36 26c0-1.5-1.5-2-2.5-2-1 0-1.5.5-2.5 1 1.5-1 4-1 5 1z" strokeLinecap="butt" />
        </g>
    </svg>
);

export const WhiteKing = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="white" stroke="black" strokeWidth="1.5">
        <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
            <path d="M22.5 25s4.5-7.5 3-10c-1.5-2.5-6-2.5-7.5 0-1.5 2.5 3 10 3 10" fill="#fff" />
            <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-5 5.5-5 5.5l-2-2.5-5 1.5-5-1.5-2 2.5s-1-6.5-5-5.5c-3 6 6 10.5 6 10.5v7z" fill="#fff" />
            <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
        </g>
    </svg>
);

export const BlackPawn = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="black" stroke="black" strokeWidth="1.5">
        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
    </svg>
);

export const BlackKnight = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="black" stroke="black" strokeWidth="1.5">
        <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
        <path d="M 24,18 C 24.38,20.32 19.32,19.97 19,18 C 19.38,15.68 23.68,16.03 24,18 z M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,32.5 13,34.5 14,36.5 C 15,38.5 17.5,37.5 18.5,37 C 19.5,36.5 19,34.5 19.5,33 C 20,31.5 21.5,29 22.5,28 C 23,27.5 22,26.5 22,25.5 C 22,22 23.5,19 25.5,16.5 C 26.5,15.25 28.5,14 28.5,12.5 C 28.5,11 27,9 25,9 C 21,9 17.5,13 16.5,13.5 C 16,13.75 15.5,14 14,14 C 13,14 12.5,13.5 12,13.5 C 11,13.5 9.5,14.5 9.5,16 C 9.5,18 10.5,19.5 10.5,20.5 C 11,21.5 11.5,23 11,23.5 C 9,24 7,26 6.5,27.5 C 6,29 6.5,30.5 6.5,30.5 L 9,26 z" />
        <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="white" stroke="white" strokeWidth="1" />
        <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="white" stroke="white" strokeWidth="1" />
    </svg>
);

export const BlackBishop = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="black" stroke="black" strokeWidth="1.5">
        <g fill="#000" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 36c3.39-.97 9.11-1.45 13.5-1.45 4.38 0 10.11.48 13.5 1.45" />
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" fill="#fff" />
        </g>
        <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#fff" strokeLinejoin="miter" />
    </svg>
);

export const BlackRook = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="black" stroke="black" strokeWidth="1.5">
        <g fill="#000" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt" />
            <path d="M34 14l-3 3H14l-3-3" />
            <path d="M31 17v12.5c0 2.75-2.25 5-5 5h-7c-2.75 0-5-2.25-5-5V17" />
            <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
            <path d="M11 14h23" fill="none" stroke="#fff" strokeWidth="1" strokeLinejoin="miter" />
        </g>
    </svg>
);

export const BlackQueen = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="black" stroke="black" strokeWidth="1.5">
        <g fill="#000" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM10.5 19.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM38.5 19.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z" />
            <path d="M9 26c0 2 1.5 2 2.5 4 1 2.5 1.5 4.5 2.5 6.5 1 2 3.5 1 4.5.5 1-.5.5-2.5 1-4 .5-1.5 2-4 3-5" />
            <path d="M36 26c0 2-1.5 2-2.5 4-1 2.5-1.5 4.5-2.5 6.5-1 2-3.5 1-4.5.5-1-.5-.5-2.5-1-4-.5-1.5-2-4-3-5" />
            <path d="M9 26c0-1.5 1.5-2 2.5-2 1 0 1.5.5 2.5 1-1.5-1-4-1-5 1z" strokeLinecap="butt" />
            <path d="M36 26c0-1.5-1.5-2-2.5-2-1 0-1.5.5-2.5 1 1.5-1 4-1 5 1z" strokeLinecap="butt" />
        </g>
    </svg>
);

export const BlackKing = ({ className, style }: PieceProps) => (
    <svg viewBox="0 0 45 45" className={className} style={style} fill="black" stroke="black" strokeWidth="1.5">
        <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
            <path d="M22.5 25s4.5-7.5 3-10c-1.5-2.5-6-2.5-7.5 0-1.5 2.5 3 10 3 10" fill="#000" />
            <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-5 5.5-5 5.5l-2-2.5-5 1.5-5-1.5-2 2.5s-1-6.5-5-5.5c-3 6 6 10.5 6 10.5v7z" fill="#000" />
            <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
        </g>
    </svg>
);

export const PIECE_COMPONENTS: Record<string, React.FC<PieceProps>> = {
    'P': WhitePawn,
    'N': WhiteKnight,
    'B': WhiteBishop,
    'R': WhiteRook,
    'Q': WhiteQueen,
    'K': WhiteKing,
    'p': BlackPawn,
    'n': BlackKnight,
    'b': BlackBishop,
    'r': BlackRook,
    'q': BlackQueen,
    'k': BlackKing
};
