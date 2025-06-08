
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, Loader2, Sparkles, Image as ImageIcon, Wand2, Camera, UploadCloud, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { diagnoseFaceAndSuggestHairstyle, type DiagnoseFaceSuggestHairstyleOutput } from '@/ai/flows/diagnose-face-suggest-hairstyle-flow';
import { generateHairstyleTryOn, type GenerateHairstyleTryOnOutput } from '@/ai/flows/generate-hairstyle-tryon-flow';

const styleTypes = ["Casual", "Trendy", "Professional", "Sporty", "Elegant", "Edgy", "Vintage", "Low-maintenance"];

const predefinedHairstyles = [
  { name: "Classic Crew Cut", imageHint: "crew cut classic", imagePlaceholder: "https://placehold.co/300x200.png" },
  { name: "Modern Quiff", imageHint: "quiff modern", imagePlaceholder: "https://placehold.co/300x200.png" },
  { name: "Textured Crop", imageHint: "textured crop", imagePlaceholder: "https://placehold.co/300x200.png" },
  { name: "Slick Back Undercut", imageHint: "slick back undercut", imagePlaceholder: "https://placehold.co/300x200.png" },
  { name: "Layered Bob", imageHint: "bob layered", imagePlaceholder: "https://placehold.co/300x200.png" },
  { name: "Pixie Cut", imageHint: "pixie edgy", imagePlaceholder: "https://placehold.co/300x200.png" },
];


export default function HairstyleSuggestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [userPhotoDataUri, setUserPhotoDataUri] = useState<string | null>(null);
  const [selectedStyleType, setSelectedStyleType] = useState<string | undefined>(undefined);
  
  const [aiSuggestion, setAiSuggestion] = useState<DiagnoseFaceSuggestHairstyleOutput | null>(null);
  const [loadingAISuggestion, setLoadingAISuggestion] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [generatedTryOnImageURL, setGeneratedTryOnImageURL] = useState<string | null>(null);
  const [loadingTryOnImage, setLoadingTryOnImage] = useState(false);

  const [showWebcam, setShowWebcam] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserPhotoDataUri(e.target?.result as string);
        setAiSuggestion(null);
        setGeneratedTryOnImageURL(null);
        setShowWebcam(false); // Hide webcam if a file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = useCallback(async () => {
    setShowWebcam(true);
    setUserPhotoDataUri(null); // Clear any uploaded photo
    setAiSuggestion(null);
    setGeneratedTryOnImageURL(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
        setShowWebcam(false);
      }
    } else {
      toast({ variant: 'destructive', title: 'Webcam Not Supported', description: 'Your browser does not support webcam access.' });
      setShowWebcam(false);
    }
  }, [toast]);

  const stopWebcam = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowWebcam(false);
    if(videoRef.current) videoRef.current.srcObject = null;
  }, [cameraStream]);

  useEffect(() => {
    // Cleanup webcam stream when component unmounts or webcam is hidden
    return () => {
      if (!showWebcam) {
        stopWebcam();
      }
    };
  }, [showWebcam, stopWebcam]);


  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUri = canvas.toDataURL('image/png');
      setUserPhotoDataUri(dataUri);
      setAiSuggestion(null);
      setGeneratedTryOnImageURL(null);
      stopWebcam(); // Stop webcam after capture
    }
  };
  
  const handleGetAISuggestion = async () => {
    if (!userPhotoDataUri || !selectedStyleType) {
      toast({ title: "Missing Information", description: "Please provide a photo and select a style type.", variant: "destructive" });
      return;
    }
    setLoadingAISuggestion(true);
    setAiError(null);
    setAiSuggestion(null);
    setGeneratedTryOnImageURL(null); 

    try {
      const result = await diagnoseFaceAndSuggestHairstyle({ userPhotoDataUri, preferredStyleType: selectedStyleType });
      setAiSuggestion(result);
      toast({ title: "AI Suggestion Ready!", description: `Our AI stylist thinks a ${result.suggestedHairstyleName} would look great!`});
    } catch (error: any) {
      console.error("Error getting AI hairstyle suggestion:", error);
      setAiError(error.message || "Failed to get AI hairstyle suggestion. Please try again.");
      toast({ title: "Suggestion Failed", description: error.message || "Could not get an AI suggestion.", variant: "destructive" });
    } finally {
      setLoadingAISuggestion(false);
    }
  };

  const handleGenerateTryOnImage = async () => {
    if (!userPhotoDataUri || !aiSuggestion?.suggestedHairstyleName) {
      toast({ title: "Missing Information", description: "Need a user photo and an AI hairstyle suggestion first.", variant: "destructive" });
      return;
    }
    setLoadingTryOnImage(true);
    setGeneratedTryOnImageURL(null);

    try {
      const result = await generateHairstyleTryOn({ 
        userPhotoDataUri, 
        hairstyleDescription: aiSuggestion.suggestedHairstyleName // Using the name as a concise description for try-on
      });
      setGeneratedTryOnImageURL(result.generatedTryOnImageDataUri);
      toast({ title: "Visualization Ready!", description: "Here's how the suggested style might look on you." });
    } catch (error: any) {
      console.error("Error generating try-on image:", error);
      toast({ title: "Visualization Failed", description: error.message || "Could not generate the try-on image.", variant: "destructive" });
    } finally {
      setLoadingTryOnImage(false);
    }
  };

  const handleBookStyle = (styleName: string) => {
    router.push(`/barbers?style=${encodeURIComponent(styleName)}`);
  };

  const clearPhoto = () => {
    setUserPhotoDataUri(null);
    setAiSuggestion(null);
    setGeneratedTryOnImageURL(null);
    if(showWebcam) stopWebcam();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <CardTitle className="text-3xl font-headline flex items-center"><Wand2 className="w-8 h-8 mr-3 text-primary"/>AI Hairstyle Advisor</CardTitle>
          <CardDescription>Upload your photo or use your webcam, select your style vibe, and let our AI suggest and visualize your next look!</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          {/* Photo Input Section */}
          <div className="space-y-4">
            <Label className="text-md font-semibold">Your Photo</Label>
            {!userPhotoDataUri && !showWebcam && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => document.getElementById('photoUpload')?.click()} className="py-6 text-base">
                        <UploadCloud className="mr-2 h-5 w-5"/> Upload Photo
                    </Button>
                    <Input type="file" id="photoUpload" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <Button variant="outline" onClick={startWebcam} className="py-6 text-base">
                        <Camera className="mr-2 h-5 w-5"/> Use Webcam
                    </Button>
                </div>
            )}

            {showWebcam && !userPhotoDataUri && (
                <Card className="p-4">
                    <CardTitle className="text-lg mb-2">Webcam Preview</CardTitle>
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline muted />
                    {hasCameraPermission === false && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertTitle>Camera Access Denied</AlertTitle>
                            <AlertDescription>Please enable camera permissions in your browser settings to use the webcam.</AlertDescription>
                        </Alert>
                    )}
                    <div className="mt-4 flex gap-2">
                        <Button onClick={capturePhoto} disabled={hasCameraPermission !== true}>Capture Photo</Button>
                        <Button variant="outline" onClick={stopWebcam}>Close Webcam</Button>
                    </div>
                </Card>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {userPhotoDataUri && (
              <div className="text-center space-y-2">
                <Image src={userPhotoDataUri} alt="Your photo" data-ai-hint="user portrait" width={200} height={200} className="rounded-lg mx-auto shadow-md aspect-square object-cover" />
                <Button variant="outline" size="sm" onClick={clearPhoto}><RotateCcw className="mr-2 h-4 w-4"/>Change Photo</Button>
              </div>
            )}
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

          <Button
            size="lg"
            className="w-full py-3 text-base"
            onClick={handleGetAISuggestion}
            disabled={loadingAISuggestion || !userPhotoDataUri || !selectedStyleType}
          >
            {loadingAISuggestion && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <Sparkles className="mr-2 h-5 w-5" /> Get AI Hairstyle Suggestion
          </Button>

          {aiError && <p className="text-destructive text-center py-2 bg-destructive/10 rounded-md">{aiError}</p>}

          {/* AI Suggestion Display */}
          {aiSuggestion && (
            <Card className="bg-muted/50 p-4 sm:p-6 mt-6 shadow-md">
              <CardTitle className="text-xl text-primary mb-1">AI Suggestion: {aiSuggestion.suggestedHairstyleName}</CardTitle>
              <CardDescription className="mb-3">Detected Face Shape: <span className="font-semibold">{aiSuggestion.detectedFaceShape}</span></CardDescription>
              
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <p className="text-foreground/90">{aiSuggestion.suggestedHairstyleDescription}</p>
                  <p className="text-xs text-muted-foreground italic break-words">For visualization reference: &quot;{aiSuggestion.hairstyleVisualizationImagePrompt}&quot;</p>
                  
                  <div className="space-y-2 pt-2">
                     <Button 
                      onClick={handleGenerateTryOnImage} 
                      disabled={loadingTryOnImage || !userPhotoDataUri}
                      className="w-full"
                    >
                      {loadingTryOnImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                      Visualize this Style on My Photo
                    </Button>
                    <Button 
                      onClick={() => handleBookStyle(aiSuggestion.suggestedHairstyleName)}
                      className="w-full bg-accent hover:bg-accent/90"
                      variant="default"
                    >
                      Book "{aiSuggestion.suggestedHairstyleName}" <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* AI Try-on Image Display */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center shadow-inner">
                  {loadingTryOnImage ? (
                     <div className="text-center p-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Generating your new look...</p>
                     </div>
                  ) : generatedTryOnImageURL ? (
                    <Image src={generatedTryOnImageURL} alt={`AI try-on for: ${aiSuggestion.suggestedHairstyleName}`} data-ai-hint="hairstyle try on" fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2"/>
                      <p className="text-sm">Your AI-generated hairstyle visualization will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Predefined Hairstyles Section */}
      <div className="space-y-6 pt-6">
        <div className="text-center">
          <h2 className="text-2xl font-headline text-primary">Or, Choose From Popular Styles</h2>
          <p className="text-muted-foreground">Browse these common hairstyles and book one directly.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
