import { queryOptions, useQuery } from "@tanstack/react-query";

const apikeyQuery = queryOptions({
    queryKey: ["api-keys"],
    queryFn: async (): Promise<
        {
            provider: string;
            name: string;
            encrypted_key: string;
        }[]
    > => {
        const storedKeys = localStorage.getItem("api_keys");
        return storedKeys ? JSON.parse(storedKeys) : [];
    },
});

export const useApikeyQuery = () => useQuery({...apikeyQuery});