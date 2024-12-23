import AIForm from "@/components/AIForm";
import ResponseDetailsCard from "@/components/ResponseDetailsCard";
import ResultsTable from "@/components/ResultsTable";
import { Card, CardContent } from "@/components/ui/card";
import useModels from "@/hooks/useModels";
import { AIResponse, RowTable } from "@/types/airesponse";
import { useState } from "react";

function App() {
  const { models, loading: loadingModels, error: errorModels } = useModels();
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
  const [errorResponse, setErrorResponse] = useState<string | null>(null);
  const [result, setResult] = useState<RowTable[] | null>(null);
  const [inputTokens, setInputTokens] = useState<string | null>(null);
  const [outputTokens, setOutputTokens] = useState<string | null>(null);
  const [fetchDuration, setFetchDuration] = useState<number | null>(null);

  const handleSubmit = async (
    ai: string,
    model: string,
    method: string,
    pdfFile: File
  ) => {
    const formData = new FormData();
    formData.append("ai", ai);
    formData.append("model", model);
    formData.append("method", method);
    formData.append("pdf", pdfFile);

    const startTime = new Date().getTime();

    try {
      setErrorResponse(null);
      setLoadingResponse(true);
      const res = await fetch("http://127.0.0.1:5000/api/get-table", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to process PDF");
      }

      const data: AIResponse = await res.json();
      setResult(JSON.parse(data.result));
      setInputTokens(data.input_tokens);
      setOutputTokens(data.output_tokens);
    } catch (err) {
      console.error(err);
      setErrorResponse("An error occurred while processing the PDF.");
    } finally {
      const endTime = new Date().getTime();
      setFetchDuration((endTime - startTime) / 1000);
      setLoadingResponse(false);
    }
  };

  return (
    <>
      <div className="hidden h-screen p-5 lg:grid grid-cols-3 gap-5">
        <div className="col-span-1">
          <AIForm
            models={models}
            onSubmit={handleSubmit}
            loadingModels={loadingModels}
            errorModels={errorModels}
            loadingResponse={loadingResponse}
          />
          <ResponseDetailsCard
            inputTokens={inputTokens}
            outputTokens={outputTokens}
            fetchDuration={fetchDuration}
          />
        </div>
        <div className="col-span-2">
          <Card className="h-[calc(100vh-40px)] overflow-auto">
            <CardContent className="h-full pt-6">
              {loadingResponse ? (
                <p className="text-center pt-20">Loading...</p>
              ) : errorResponse ? (
                <p>{errorResponse}</p>
              ) : result ? (
                <ResultsTable data={result} />
              ) : (
                <p className="text-center pt-20">
                  Upload a PDF to see the results.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="lg:hidden pt-20 px-5 text-center">
        Mobile view is not supported. Please use a desktop browser.
      </div>
    </>
  );
}

export default App;
