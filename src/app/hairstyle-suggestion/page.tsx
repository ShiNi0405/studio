
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight } from 'lucide-react';

const faceShapes = ["Round", "Oval", "Square", "Heart", "Diamond", "Long"];
const styleTypes = ["Casual", "Trendy", "Professional", "Sporty", "Elegant"];

// Dummy suggestion logic
const getDummySuggestion = (faceShape?: string, styleType?: string): string => {
  if (!faceShape || !styleType) {
    return "Select face shape and style type to get a suggestion.";
  }
  if (faceShape === "Round" && styleType === "Trendy") return "Voluminous Pompadour";
  if (faceShape === "Square" && styleType === "Professional") return "Classic Side Part";
  if (faceShape === "Oval" && styleType === "Casual") return "Textured Crop";
  return `A ${styleType.toLowerCase()} ${faceShape === "Round" || faceShape === "Oval" ? "Quiff" : "Fade"} for your ${faceShape.toLowerCase()} face.`;
};

export default function HairstyleSuggestionPage() {
  const router = useRouter();
  const [selectedFaceShape, setSelectedFaceShape] = useState<string | undefined>(undefined);
  const [selectedStyleType, setSelectedStyleType] = useState<string | undefined>(undefined);
  const [suggestedStyle, setSuggestedStyle] = useState<string>(getDummySuggestion());

  const handleSelectionChange = (faceShape?: string, styleType?: string) => {
    const newSuggestion = getDummySuggestion(faceShape, styleType);
    setSuggestedStyle(newSuggestion);
  };

  const handleBookStyle = () => {
    if (selectedFaceShape && selectedStyleType && suggestedStyle !== "Select face shape and style type to get a suggestion.") {
        // Use a generic style name or the specific dummy suggestion for booking
        const styleToBook = suggestedStyle.split(" for your")[0]; // Extract the style part
        router.push(`/barbers?style=${encodeURIComponent(styleToBook)}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">AI Hairstyle Suggester</CardTitle>
          <CardDescription>Find the perfect hairstyle based on your face shape and preferred style.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="face-shape" className="text-lg">Face Shape</Label>
            <Select
              value={selectedFaceShape}
              onValueChange={(value) => {
                setSelectedFaceShape(value);
                handleSelectionChange(value, selectedStyleType);
              }}
            >
              <SelectTrigger id="face-shape" className="mt-1">
                <SelectValue placeholder="Select your face shape" />
              </SelectTrigger>
              <SelectContent>
                {faceShapes.map((shape) => (
                  <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="style-type" className="text-lg">Preferred Style Type</Label>
            <Select
              value={selectedStyleType}
              onValueChange={(value) => {
                setSelectedStyleType(value);
                handleSelectionChange(selectedFaceShape, value);
              }}
            >
              <SelectTrigger id="style-type" className="mt-1">
                <SelectValue placeholder="Select your style type" />
              </SelectTrigger>
              <SelectContent>
                {styleTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFaceShape && selectedStyleType && (
            <Card className="bg-muted/50 p-6">
              <CardTitle className="text-xl text-primary mb-2">Our Suggestion:</CardTitle>
              <p className="text-lg font-semibold text-foreground">{suggestedStyle}</p>
            </Card>
          )}

          <Button
            size="lg"
            className="w-full text-lg py-7"
            onClick={handleBookStyle}
            disabled={!selectedFaceShape || !selectedStyleType || suggestedStyle.startsWith("Select")}
          >
            Book This Style <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </CardContent>
      </Card>
       <div className="text-center">
         <Button variant="link" onClick={() => router.push('/')}>Back to Home</Button>
      </div>
    </div>
  );
}
