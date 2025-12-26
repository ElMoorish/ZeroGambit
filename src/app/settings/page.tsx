import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
    return (
        <div className="flex justify-center p-8 min-h-screen bg-background">
            <UserProfile path="/settings" routing="path" />
        </div>
    );
}
