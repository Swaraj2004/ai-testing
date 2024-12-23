import { useState, useEffect } from "react";
import { AIModel } from "@/types/aimodel";

const useModels = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/ai-models`
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const data: AIModel[] = await response.json();
        setModels(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { models, loading, error };
};

export default useModels;
