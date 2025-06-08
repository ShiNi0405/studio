
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Loader2, Sparkles, Image as ImageIcon, Wand2 } from 'lucide-react';
import { suggestHairstyle, type SuggestHairstyleOutput } from '@/ai/flows/suggest-hairstyle-flow';
import { generateHairstyleImage, type GenerateHairstyleImageOutput } from '@/ai/flows/generate-hairstyle-image-flow';
import { useToast } from '@/hooks/use-toast';

const faceShapes = ["Round", "Oval", "Square", "Heart", "Diamond", "Long"];
const styleTypes = ["Casual", "Trendy", "Professional", "Sporty", "Elegant", "Edgy", "Vintage"];

const predefinedHairstyles = [
  { name: "Classic Crew Cut", imageHint: "crew cut classic", imagePlaceholder: "https://placehold.co/300x200.png" },
  { name: "Modern Quiff", imageHint: "quiff modern", imagePlaceholder: "https://placehold.co/300x200.png" },
  { name: "Textured Crop", imageHint: "textured crop", imagePlaceholder: "https://placehold.co/300x200.png" },
  { name: "Slick Back Undercut", imageHint: "slick back undercut", imagePlaceholder: "https://placehold.co/300x200.png" },
];


export default function HairstyleSuggestionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedFaceShape, setSelectedFaceShape] = useState<string | undefined>(undefined);
  const [selectedStyleType, setSelectedStyleType] = useState<string | undefined>(undefined);
  
  const [aiSuggestion, setAiSuggestion] = useState<SuggestHairstyleOutput | null>(null);
  const [loadingAISuggestion, setLoadingAISuggestion] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [generatedImageURL, setGeneratedImageURL] = useState<string | null>(null);
  const [loadingGeneratedImage, setLoadingGeneratedImage] = useState(false);


  const handleGetAISuggestion = async () => {
    if (!selectedFaceShape || !selectedStyleType) {
      toast({ title: "Missing Information", description: "Please select both face shape and style type.", variant: "destructive" });
      return;
    }
    setLoadingAISuggestion(true);
    setAiError(null);
    setAiSuggestion(null);
    setGeneratedImageURL(null); 
    try {
      const suggestion = await suggestHairstyle({ faceShape: selectedFaceShape, preferredStyleType: selectedStyleType });
      setAiSuggestion(suggestion);
    } catch (error: any) {
      console.error("Error getting AI suggestion:", error);
      setAiError(error.message || "Failed to get AI suggestion.");
      toast({ title: "Suggestion Failed", description: error.message || "Could not fetch AI suggestion.", variant: "destructive" });
    } finally {
      setLoadingAISuggestion(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!aiSuggestion?.suggestedHairstyleImagePrompt) {
      toast({ title: "No Prompt", description: "Cannot generate image without an AI suggestion prompt.", variant: "destructive" });
      return;
    }
    setLoadingGeneratedImage(true);
    setGeneratedImageURL(null);
    try {
      const result: GenerateHairstyleImageOutput = await generateHairstyleImage({ imagePrompt: aiSuggestion.suggestedHairstyleImagePrompt });
      setGeneratedImageURL(result.imageDataURI);
      toast({ title: "Image Generated!", description: "The AI has conjured an image for your suggested style." });
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({ title: "Image Generation Failed", description: error.message || "Could not generate image.", variant: "destructive" });
      // Keep placeholder or show an error image if you have one
    } finally {
      setLoadingGeneratedImage(false);
    }
  };

  const handleBookStyle = (styleName: string) => {
    router.push(`/barbers?style=${encodeURIComponent(styleName)}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <CardTitle className="text-3xl font-headline flex items-center"><Wand2 className="w-8 h-8 mr-3 text-primary"/>AI Hairstyle Advisor</CardTitle>
          <CardDescription>Let our AI help you discover your next look. Select your features and preferred style below.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div>
              <Label htmlFor="face-shape" className="text-md font-semibold">Your Face Shape</Label>
              <Select value={selectedFaceShape} onValueChange={setSelectedFaceShape}>
                <SelectTrigger id="face-shape" className="mt-1">
                  <SelectValue placeholder="Select your face shape" />
                </SelectTrigger>
                <SelectContent>
                  {faceShapes.map((shape) => <SelectItem key={shape} value={shape}>{shape}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="style-type" className="text-md font-semibold">Preferred Style Vibe</Label>
              <Select value={selectedStyleType} onValueChange={setSelectedStyleType}>
                <SelectTrigger id="style-type" className="mt-1">
                  <SelectValue placeholder="Select your style vibe" />
                </SelectTrigger>
                <SelectContent>
                  {styleTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full py-3 text-base"
            onClick={handleGetAISuggestion}
            disabled={loadingAISuggestion || !selectedFaceShape || !selectedStyleType}
          >
            {loadingAISuggestion && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <Sparkles className="mr-2 h-5 w-5" /> Get AI Suggestion
          </Button>

          {aiError && <p className="text-destructive text-center">{aiError}</p>}

          {aiSuggestion && (
            <Card className="bg-muted/50 p-4 sm:p-6 mt-6 shadow-md">
              <CardTitle className="text-xl text-primary mb-3">AI Suggests: {aiSuggestion.suggestedHairstyleName}</CardTitle>
              <div className="grid md:grid-cols-2 gap-4 items-center">
                <div className="space-y-3">
                  <p className="text-foreground/90">{aiSuggestion.suggestedHairstyleDescription}</p>
                   <p className="text-xs text-muted-foreground italic break-words">Image prompt: &quot;{aiSuggestion.suggestedHairstyleImagePrompt}&quot;</p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      onClick={handleGenerateImage} 
                      disabled={loadingGeneratedImage || !aiSuggestion.suggestedHairstyleImagePrompt}
                      variant="outline"
                      className="flex-1"
                    >
                      {loadingGeneratedImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <ImageIcon className="mr-2 h-4 w-4" /> Generate Image
                    </Button>
                    <Button 
                      onClick={() => handleBookStyle(aiSuggestion.suggestedHairstyleName)}
                      className="flex-1 bg-accent hover:bg-accent/90"
                    >
                      Book This Style <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                  {loadingGeneratedImage ? (
                     <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  ) : generatedImageURL ? (
                    <Image src={generatedImageURL} alt={`AI generated: ${aiSuggestion.suggestedHairstyleName}`} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2"/>
                      <p className="text-sm">Image will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-headline text-primary">Or, Choose From Popular Styles</h2>
          <p className="text-muted-foreground">Browse these common hairstyles and book one directly.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {predefinedHairstyles.map((style) => (
            <Card key={style.name} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative aspect-video bg-gray-100">
                <Image 
                    src={style.imagePlaceholder} 
                    alt={style.name} 
                    data-ai-hint={style.imageHint} 
                    fill 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105" 
                />
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{style.name}</CardTitle>
              </CardHeader>
              <CardFooter className="p-4 pt-0">
                <Button className="w-full" onClick={() => handleBookStyle(style.name)}>
                  Book {style.name} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
       <div className="text-center mt-12">
         <Button variant="link" onClick={() => router.push('/')}>Back to Home</Button>
      </div>
    </div>
  );
}
