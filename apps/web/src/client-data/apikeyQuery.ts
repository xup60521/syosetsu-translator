import {
    queryOptions,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import z from "zod";
import { v4 as uuid } from "uuid";

const apiKeySchema = z.object({
    id: z.uuidv4().optional(),
    provider: z.string(),
    name: z.string(),
    encrypted_key: z.string(),
});

const API_KEY_STORAGE_KEY = "api_keys";
const API_KEY_QUERY_KEY = "api-keys";

export type APIKeyType = Omit<z.infer<typeof apiKeySchema>, "id"> & {
    id: string;
};

async function getAPIKeysFromLocalStorage(): Promise<APIKeyType[]> {
    const storedKeysString = localStorage.getItem(API_KEY_STORAGE_KEY);
    const parseResult = z
        .array(apiKeySchema)
        .safeParse(JSON.parse(storedKeysString ?? "{}"));
    if (parseResult.success) {
        const data = parseResult.data;
        let isMigrationNeeded = false;
        const data_with_uuid = data.map((d) => {
            if (!d.id) {
                isMigrationNeeded = true;
                d["id"] = uuid();
            }
            return d;
        }) as APIKeyType[];
        if (isMigrationNeeded) {
            localStorage.setItem(
                API_KEY_STORAGE_KEY,
                JSON.stringify(data_with_uuid),
            );
        }
        return data_with_uuid;
    }
    return [];
}

export const useApikeyQuery = () =>
    useQuery({
        queryKey: [API_KEY_QUERY_KEY],
        queryFn: getAPIKeysFromLocalStorage,
    });

export const useAddApiKeyMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: APIKeyType) => {
            const current_api_keys = await getAPIKeysFromLocalStorage();
            const added_api_keys = [...current_api_keys, payload];
            localStorage.setItem(
                API_KEY_STORAGE_KEY,
                JSON.stringify(added_api_keys),
            );
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: [API_KEY_QUERY_KEY] }),
    });
};

export const useDeleteApiKeyMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const current_api_keys = await getAPIKeysFromLocalStorage();
            const deleted_api_keys = current_api_keys.filter(
                (d) => d.id !== id,
            );
            localStorage.setItem(
                API_KEY_STORAGE_KEY,
                JSON.stringify(deleted_api_keys),
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [API_KEY_QUERY_KEY] });
        },
    });
};

export const useEditApiKeyMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            const current_api_keys = await getAPIKeysFromLocalStorage();
            const edited_api_keys = current_api_keys.map((item) => {
                if (item.id === id) {
                    item.name = name;
                }
                return item;
            });
            localStorage.setItem(
                API_KEY_STORAGE_KEY,
                JSON.stringify(edited_api_keys),
            );
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: [API_KEY_QUERY_KEY] }),
    });
};
