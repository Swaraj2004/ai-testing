import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIModel } from "@/types/aimodel";

interface AIFormProps {
  models: AIModel[];
  onSubmit: (
    ai: string,
    model: string,
    method: string,
    pdfFile: File
  ) => Promise<void>;
  loadingModels: boolean;
  errorModels: string | null;
  loadingResponse: boolean;
}

const AIForm: React.FC<AIFormProps> = ({
  models,
  onSubmit,
  loadingModels,
  errorModels,
  loadingResponse,
}) => {
  const [selectedAI, setSelectedAI] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleFormSubmit = async () => {
    if (!selectedAI || !selectedModel || !selectedMethod || !pdfFile) {
      alert("Please fill in all fields.");
      return;
    }

    await onSubmit(selectedAI, selectedModel, selectedMethod, pdfFile);
  };

  return (
    <Card>
      {loadingModels && <p className="p-6">Loading AIs...</p>}
      {errorModels && <p className="p-6">Error loading AIs: {errorModels}</p>}
      {!loadingModels && !errorModels && (
        <>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>AI Provider</Label>
                <Select onValueChange={(value) => setSelectedAI(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an AI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {models.map((ai) => (
                        <SelectItem key={ai.id} value={ai.id}>
                          {ai.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Model</Label>
                <Select
                  disabled={!selectedAI}
                  onValueChange={(value) => setSelectedModel(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {models
                        .find((ai) => ai.id === selectedAI)
                        ?.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Method</Label>
                <Select
                  disabled={!selectedAI}
                  onValueChange={(value) => setSelectedMethod(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {models
                        .find((ai) => ai.id === selectedAI)
                        ?.supported_methods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pdf">PDF File</Label>
                <Input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={(e) =>
                    setPdfFile(e.target.files ? e.target.files[0] : null)
                  }
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              color="primary"
              onClick={handleFormSubmit}
              disabled={!pdfFile || loadingResponse}
            >
              Submit
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default AIForm;
