export interface ModuleProgress {
    module_id: string;
    xp: number;
    level: number;
    streak: number;
    last_active: string;
}

export interface UserCurriculumProgress {
    user_id: string;
    modules: Record<string, ModuleProgress>;
    total_xp: number;
    total_levels: number;
}
