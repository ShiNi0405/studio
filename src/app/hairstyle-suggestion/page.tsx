
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
import { ArrowRight, Loader2, Sparkles, Image as ImageIcon, Wand2, Camera, UploadCloud, RotateCcw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ALL_HAIRCUT_OPTIONS, MENS_HAIRCUT_OPTIONS, WOMENS_HAIRCUT_OPTIONS, type HaircutOptionConfig } from '@/config/hairstyleOptions';

interface MockDiagnoseFaceSuggestHairstyleOutput {
  detectedFaceShape: string;
  suggestedHairstyleName: string; // This will be the general name
  suggestedHairstyleDescription: string;
  hairstyleVisualizationImagePrompt: string; // For generating an image of the style itself (mock)
  haircutOptionId?: string; // If the suggestion maps to a predefined option
}

const styleTypes = ["Casual", "Trendy", "Professional", "Sporty", "Elegant", "Edgy", "Vintage", "Low-maintenance"];

// Use a subset or all from config for the popular styles display
const popularDisplayStyles: HaircutOptionConfig[] = [
    ...MENS_HAIRCUT_OPTIONS.filter(opt => !opt.isCustom).slice(0, 3), // e.g. first 3 men's
    ...WOMENS_HAIRCUT_OPTIONS.filter(opt => !opt.isCustom).slice(0, 3)  // e.g. first 3 women's
];


export default function HairstyleSuggestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [userPhotoDataUri, setUserPhotoDataUri] = useState<string | null>(null);
  const [selectedStyleType, setSelectedStyleType] = useState<string | undefined>(undefined);
  
  const [aiSuggestion, setAiSuggestion] = useState<MockDiagnoseFaceSuggestHairstyleOutput | null>(null);
  const [loadingAISuggestion, setLoadingAISuggestion] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [generatedTryOnImageURL, setGeneratedTryOnImageURL] = useState<string | null>(null);
  const [currentTryOnStyleName, setCurrentTryOnStyleName] = useState<string | null>(null); // Name for display
  const [currentTryOnOptionId, setCurrentTryOnOptionId] = useState<string | null>(null); // ID for booking
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
        setCurrentTryOnStyleName(null);
        setCurrentTryOnOptionId(null);
        if (showWebcam) stopWebcam(); 
      };
      reader.readAsDataURL(file);
    }
  };

  const stopWebcam = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    setCameraStream(null);
    setShowWebcam(false); 
    if(videoRef.current) videoRef.current.srcObject = null;
  }, [cameraStream]);


  const startWebcam = useCallback(async () => {
    setShowWebcam(true); 
    setUserPhotoDataUri(null); 
    setAiSuggestion(null);
    setGeneratedTryOnImageURL(null);
    setCurrentTryOnStyleName(null);
    setCurrentTryOnOptionId(null);
    setHasCameraPermission(null); 

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
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
      }
    } else {
      toast({ variant: 'destructive', title: 'Webcam Not Supported', description: 'Your browser does not support webcam access.' });
      setShowWebcam(false); 
    }
  }, [toast]);

  useEffect(() => {
    return () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
    };
  }, [cameraStream]);


  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraStream) { 
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
      setCurrentTryOnStyleName(null);
      setCurrentTryOnOptionId(null);
      stopWebcam(); 
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
    setCurrentTryOnStyleName(null);
    setCurrentTryOnOptionId(null);

    setTimeout(() => {
      // Mock: Try to pick a style from the known options
      const compatibleOptions = ALL_HAIRCUT_OPTIONS.filter(opt => !opt.isCustom);
      const randomOption = compatibleOptions[Math.floor(Math.random() * compatibleOptions.length)] || ALL_HAIRCUT_OPTIONS[0];
      const suggestedName = randomOption.name; // Use the name from the config
      
      const mockResult: MockDiagnoseFaceSuggestHairstyleOutput = {
        detectedFaceShape: ["Oval", "Round", "Square", "Heart"][Math.floor(Math.random() * 4)],
        suggestedHairstyleName: suggestedName,
        suggestedHairstyleDescription: `This is a mock description for a ${suggestedName}. It's designed for a ${selectedStyleType.toLowerCase()} vibe, offering a stylish yet manageable look.`,
        hairstyleVisualizationImagePrompt: `photorealistic image of a ${suggestedName} hairstyle, ${selectedStyleType} style`,
        haircutOptionId: randomOption.id, // Include the ID
      };
      setAiSuggestion(mockResult);
      setCurrentTryOnStyleName(mockResult.suggestedHairstyleName);
      setCurrentTryOnOptionId(mockResult.haircutOptionId || null);
      toast({ title: "AI Suggestion Ready!", description: `Our AI stylist (mock) thinks a ${mockResult.suggestedHairstyleName} would look great!`});
      setLoadingAISuggestion(false);
    }, 2000); 
  };

  const handleGenerateTryOnImage = async (hairstyleName: string, optionId?: string | null) => {
    if (!userPhotoDataUri) {
      toast({ title: "Missing Photo", description: "Please provide your photo first to visualize a hairstyle.", variant: "destructive" });
      return;
    }
    if (!hairstyleName) {
        toast({ title: "Missing Hairstyle", description: "No hairstyle specified for visualization.", variant: "destructive" });
        return;
    }
    setLoadingTryOnImage(true);
    setGeneratedTryOnImageURL(null); 
    setCurrentTryOnStyleName(hairstyleName); 
    setCurrentTryOnOptionId(optionId || null);

    // If an AI suggestion was active, clear it when trying on a predefined style
    if (aiSuggestion && aiSuggestion.suggestedHairstyleName !== hairstyleName) {
      setAiSuggestion(null);
    }


    setTimeout(() => {
      const placeholderUrl = `https://placehold.co/400x400.png?text=Try-On:${hairstyleName.substring(0,10).replace(/\s/g,'+')}&font=lora`;
      setGeneratedTryOnImageURL(placeholderUrl);
      toast({ title: "Visualization Ready!", description: `Here's how a ${hairstyleName} might look on you (mock image).` });
      setLoadingTryOnImage(false);
    }, 3000); 
  };

  const handleBookStyle = () => {
    const styleToBook = currentTryOnStyleName || aiSuggestion?.suggestedHairstyleName;
    const optionIdToBook = currentTryOnOptionId || aiSuggestion?.haircutOptionId;

    if (!styleToBook) {
        toast({title: "No style selected", description: "Please select or get a style suggestion to book.", variant: "destructive"});
        return;
    }
    
    let queryString = `style=${encodeURIComponent(styleToBook)}`;
    if (optionIdToBook) {
        queryString += `&haircutOptionId=${encodeURIComponent(optionIdToBook)}`;
    }
    router.push(`/barbers?${queryString}`);
  };

  const clearPhotoAndSuggestions = () => {
    setUserPhotoDataUri(null);
    setAiSuggestion(null);
    setGeneratedTryOnImageURL(null);
    setCurrentTryOnStyleName(null);
    setCurrentTryOnOptionId(null);
    setAiError(null);
    if(showWebcam) stopWebcam();
  }
  
  // Determine the name of the style currently being considered for booking/visualization
  const activeStyleNameForActions = currentTryOnStyleName || aiSuggestion?.suggestedHairstyleName;


  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <CardTitle className="text-3xl font-headline flex items-center"><Wand2 className="w-8 h-8 mr-3 text-primary"/>AI Hairstyle Advisor</CardTitle>
          <CardDescription>Upload your photo or use your webcam, select your style vibe, and let our AI suggest and visualize your next look! Or, try on popular styles.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="space-y-4">
            <Label className="text-md font-semibold">Step 1: Your Photo</Label>
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
                            <AlertDescription>Please enable camera permissions in your browser settings to use the webcam. You might need to refresh the page after enabling.</AlertDescription>
                        </Alert>
                    )}
                    {hasCameraPermission === null && !cameraStream && ( 
                        <Alert variant="default" className="mt-2">
                            <AlertTitle>Requesting Camera</AlertTitle>
                            <AlertDescription>Attempting to access your webcam. Please allow permission when prompted.</AlertDescription>
                        </Alert>
                    )}
                    <div className="mt-4 flex gap-2">
                        <Button onClick={capturePhoto} disabled={!cameraStream || hasCameraPermission !== true}>Capture Photo</Button>
                        <Button variant="outline" onClick={stopWebcam}>Close Webcam</Button>
                    </div>
                </Card>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {userPhotoDataUri && (
              <div className="text-center space-y-2">
                <Image src={userPhotoDataUri} alt="Your photo" data-ai-hint="user portrait" width={200} height={200} className="rounded-lg mx-auto shadow-md aspect-square object-cover" />
                <Button variant="outline" size="sm" onClick={clearPhotoAndSuggestions}><RotateCcw className="mr-2 h-4 w-4"/>Change Photo / Reset</Button>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="style-type" className="text-md font-semibold">Step 2: Preferred Style Vibe (for AI Suggestion)</Label>
            <Select value={selectedStyleType} onValueChange={setSelectedStyleType} disabled={!userPhotoDataUri}>
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

          {/* Display area for AI suggestion details AND try-on image */}
          {(aiSuggestion || generatedTryOnImageURL || loadingTryOnImage) && (
            <Card className="bg-muted/50 p-4 sm:p-6 mt-6 shadow-md">
                {/* AI Suggestion Details (only if AI suggestion is active and no try-on image is being loaded/shown for a *different* style) */}
                {aiSuggestion && (!generatedTryOnImageURL && !loadingTryOnImage || currentTryOnStyleName === aiSuggestion.suggestedHairstyleName) && ( 
                    <>
                        <CardTitle className="text-xl text-primary mb-1">AI Suggestion: {aiSuggestion.suggestedHairstyleName}</CardTitle>
                        <CardDescription className="mb-3">Detected Face Shape (Mock): <span className="font-semibold">{aiSuggestion.detectedFaceShape}</span></CardDescription>
                        <p className="text-foreground/90 mb-3">{aiSuggestion.suggestedHairstyleDescription}</p>
                        <p className="text-xs text-muted-foreground italic break-words mb-3">For visualization reference (Mock): &quot;{aiSuggestion.hairstyleVisualizationImagePrompt}&quot;</p>
                    </>
                )}
                {/* Title for a tried-on popular style if no AI suggestion is active or if it's different */}
                {currentTryOnStyleName && (!aiSuggestion || aiSuggestion.suggestedHairstyleName !== currentTryOnStyleName) && !loadingTryOnImage &&(
                     <CardTitle className="text-xl text-primary mb-3">Trying On: {currentTryOnStyleName}</CardTitle>
                )}


              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                    {activeStyleNameForActions && (
                         <Button 
                            onClick={() => handleGenerateTryOnImage(activeStyleNameForActions, currentTryOnOptionId || aiSuggestion?.haircutOptionId)} 
                            disabled={loadingTryOnImage || !userPhotoDataUri}
                            className="w-full"
                            variant="default"
                          >
                            {loadingTryOnImage && activeStyleNameForActions === currentTryOnStyleName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                            Visualize "{activeStyleNameForActions}" (Mock)
                          </Button>
                    )}
                     <Button 
                      onClick={handleBookStyle}
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={!activeStyleNameForActions}
                    >
                      Book "{activeStyleNameForActions}" <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center shadow-inner">
                  {loadingTryOnImage ? (
                     <div className="text-center p-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Generating your new look (mock)...</p>
                     </div>
                  ) : generatedTryOnImageURL ? (
                    <Image src={generatedTryOnImageURL} alt={`AI try-on for: ${currentTryOnStyleName}`} data-ai-hint="hairstyle try on mock" fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2"/>
                      <p className="text-sm">Your AI-generated hairstyle visualization (mock) will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6 pt-6">
        <div className="text-center">
          <h2 className="text-2xl font-headline text-primary">Or, Choose From Popular Styles</h2>
          <p className="text-muted-foreground">Browse these common hairstyles, try them on with your photo, and book directly.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDisplayStyles.map((style) => (
            <Card key={style.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
              <div className="relative aspect-video bg-gray-100">
                <Image 
                    src={style.exampleImageUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(style.name.substring(0,10))}`}
                    alt={style.name} 
                    data-ai-hint={style.defaultImageHint || `${style.gender} ${style.name} hairstyle`} 
                    fill 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105" 
                />
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{style.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-grow">
                 {/* Can add a short description for popular styles here if needed */}
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto flex flex-col sm:flex-row gap-2">
                <Button 
                    className="w-full sm:flex-1" 
                    variant="outline"
                    onClick={() => {
                        handleGenerateTryOnImage(style.name, style.id);
                    }}
                    disabled={!userPhotoDataUri || loadingTryOnImage}
                >
                    <Eye className="mr-2 h-4 w-4"/> Try On (Mock)
                </Button>
                <Button className="w-full sm:flex-1" onClick={() => {
                    setCurrentTryOnStyleName(style.name); // Set context for booking
                    setCurrentTryOnOptionId(style.id);
                    handleBookStyle();
                  }}>
                  Book Style <ArrowRight className="ml-2 h-4 w-4" />
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
