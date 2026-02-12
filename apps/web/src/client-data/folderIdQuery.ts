import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import z from "zod";

const selectedFolderSchema = z.object({
    user_id: z.string(),
    folder_id: z.string(),
    name: z.string(),
});
type SelectedFolderType = z.infer<typeof selectedFolderSchema>;

function folderIdGetter(userId: string) {
    let obj: SelectedFolderType | null = null;

    const parsedResult = selectedFolderSchema.safeParse(
        JSON.parse(localStorage.getItem("selectedFolder") || "{}"),
    );
    if (parsedResult.success) {
        obj = parsedResult.data;
    }
    if (obj && obj.user_id !== userId) {
        return null;
    }

    return obj;
}

export const useFolderIdQuery = (userId: string) =>
    useQuery({
        queryKey: ["selectedFolder", userId],
        queryFn: () => folderIdGetter(userId),
    });

export const useSetFolderIdMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: SelectedFolderType) => {
            localStorage.setItem("selectedFolder", JSON.stringify(data));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["selectedFolder"] });
        },
    });
};

