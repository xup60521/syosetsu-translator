import * as React from "react";
import { FolderOpen } from "lucide-react";
import { LogOut } from "lucide-react";
import { authClient } from "@/server/better-auth/auth-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/env";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import z from "zod";
import { atom, useAtom, useSetAtom } from "jotai";
import {
    DrivePicker,
    DrivePickerDocsView,
} from "@googleworkspace/drive-picker-react";
import { createFileRoute } from "@tanstack/react-router";
import { useFolderIdQuery, useSetFolderIdMutation } from "@/client-data/folderIdQuery";

export const Route = createFileRoute("/settings/storage")({
    component: StoragePanel,
});

function StoragePanel(): React.JSX.Element {
    const { data, isPending } = authClient.useSession();

    const handleGoogleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/settings/storage",
        });
    };

    const handleLogout = async () => {
        await authClient.signOut();
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-8">
            {/* Connection Section */}
            <div className="space-y-4">
                <div className="border-b-4 border-black dark:border-white pb-4">
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">
                        Google Drive
                    </h3>
                    <p className="mt-2 text-sm sm:text-base font-mono bg-yellow-100 dark:bg-yellow-900 p-2 border-2 border-black dark:border-white inline-block">
                        Connect your account to access files to translate.
                    </p>
                </div>

                {isPending ? (
                    <div className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <Skeleton className="w-12 h-12 rounded-none shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-7 w-32 rounded-none" />
                                <Skeleton className="h-5 w-48 rounded-none" />
                            </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                            <Skeleton className="h-10 w-24 rounded-none" />
                            <Skeleton className="h-10 w-24 rounded-none" />
                        </div>
                    </div>
                ) : data ? (
                    <div className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-900 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-none border-2 border-black dark:border-white bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl shrink-0">
                                {data.user?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="flex-1 min-w-0 font-mono text-black dark:text-white">
                                <p className="font-bold truncate text-lg">
                                    {data.user?.name || "User"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {data.user?.email || "email@example.com"}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                            <Button
                                variant={"outline"}
                                onClick={handleGoogleLogin}
                                size={"sm"}
                                className="hover:bg-yellow-100 dark:hover:bg-yellow-900"
                            >
                                Reconnect
                            </Button>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                size={"sm"}
                                className="hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                <span className="sm:inline hidden">Logout</span>
                                <span className="sm:hidden inline">
                                    Log out
                                </span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-gray-50 dark:bg-zinc-900 p-8 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="bg-white dark:bg-zinc-800 p-4 rounded-full border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] mb-2 text-black dark:text-white">
                            <svg className="w-8 h-8" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        </div>
                        <h4 className="text-xl font-bold font-mono text-black dark:text-white">
                            Not Connected
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            Connect your Google Drive account to select folders
                            for saving translated novels.
                        </p>
                        <Button
                            onClick={handleGoogleLogin}
                            className="w-full max-w-xs h-12 text-lg border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-yellow-300 dark:hover:bg-yellow-700"
                        >
                            Connect with Google
                        </Button>
                    </div>
                )}
            </div>

            {/* Output Path Section */}
            {data && <SelectFolder user_id={data.user.id} />}
        </div>
    );
}

const openPickerAtom = atom(false);

function SelectFolder({ user_id }: { user_id: string }): React.JSX.Element {
    const [openPicker, setOpenPicker] = useAtom(openPickerAtom);
    const { data: selectedFolder, isPending } = useFolderIdQuery(user_id);

    return (
        <div className="space-y-4 pt-4 border-t-4 border-black dark:border-white border-dashed">
            <div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
                    Output Path
                </h3>
                <p className="mt-2 text-xs sm:text-sm font-mono bg-yellow-100 dark:bg-yellow-900 p-1 border-2 border-black dark:border-white inline-block">
                    Where files will be saved
                </p>
            </div>
            <div className="space-y-4">
                <Label className="text-sm font-bold uppercase font-mono bg-yellow-300 dark:bg-yellow-600 w-fit px-1 border-2 border-black dark:border-white">
                    Selected Folder
                </Label>

                {isPending ? (
                    <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="w-10 h-10 shrink-0 rounded-none" />
                            <div className="space-y-1">
                                <Skeleton className="h-7 w-32 rounded-none" />
                                <Skeleton className="h-4 w-48 rounded-none" />
                            </div>
                        </div>
                        <Skeleton className="h-9 w-16 shrink-0 rounded-none self-end sm:self-auto" />
                    </div>
                ) : selectedFolder ? (
                    <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="w-10 h-10 flex items-center justify-center bg-yellow-300 dark:bg-yellow-600 border-2 border-black dark:border-white shrink-0">
                                <FolderOpen className="w-6 h-6 text-black dark:text-white" />
                            </div>
                            <div className="min-w-0">
                                <span className="font-bold text-lg font-mono block truncate text-black dark:text-white">
                                    {selectedFolder.name}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                                    ID: {selectedFolder.folder_id}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setOpenPicker(true)}
                            size="sm"
                            variant="outline"
                            className="hover:bg-yellow-100 dark:hover:bg-yellow-900 self-end sm:self-auto"
                        >
                            Change
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 dark:bg-zinc-900 border-2 border-black dark:border-white border-dashed text-sm text-gray-500 dark:text-gray-400 font-mono text-center py-8">
                        No folder selected
                    </div>
                )}

                {!isPending && !selectedFolder && (
                    <Button
                        onClick={() => setOpenPicker(true)}
                        className="w-full h-12 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] bg-stone-500 dark:bg-stone-700 text-white hover:bg-stone-600 dark:hover:bg-stone-800 text-lg"
                        size="sm"
                    >
                        <FolderOpen className="w-5 h-5 mr-2" />
                        Select Output Path
                    </Button>
                )}
                {openPicker && <GoogleDrivePicker user_id={user_id} />}
            </div>
        </div>
    );
}

function GoogleDrivePicker({ user_id }: { user_id: string }) {
    const setOpenPicker = useSetAtom(openPickerAtom);
    const setFolderIdMutation = useSetFolderIdMutation();
    const handlePicked = (e: CustomEvent) => {
        const docs = e.detail?.docs;
        if (docs && docs.length > 0) {
            const folder = docs[0];
            const { id, name } = folder as { id: string; name: string };
            localStorage.setItem(
                "selectedFolder",
                JSON.stringify({ id, name }),
            );
            setFolderIdMutation
                .mutateAsync({ user_id, folder_id: id, name })
                .then(() => setOpenPicker(false));
        }
    };

    const handleCanceled = () => {
        setOpenPicker(false);
    };
    return (
        <DrivePicker
            client-id={env.VITE_GOOGLE_CLIENT_ID!}
            app-id={env.VITE_GOOGLE_APP_ID!}
            scope="https://www.googleapis.com/auth/drive.file"
            onPicked={handlePicked}
            onCanceled={handleCanceled}
            origin={
                typeof window !== "undefined"
                    ? window.location.origin
                    : undefined
            }
        >
            <DrivePickerDocsView
                mime-types="application/vnd.google-apps.folder"
                starred={"default"}
                select-folder-enabled="true"
            />
        </DrivePicker>
    );
}
