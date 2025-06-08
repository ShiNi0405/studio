
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

// Define mock output types locally
interface MockDiagnoseFaceSuggestHairstyleOutput {
  detectedFaceShape: string;
  suggestedHairstyleName: string;
  suggestedHairstyleDescription: string;
  hairstyleVisualizationImagePrompt: string;
}

const styleTypes = ["Casual", "Trendy", "Professional", "Sporty", "Elegant", "Edgy", "Vintage", "Low-maintenance"];

const predefinedHairstyles = [
  { id: "crew-cut", name: "Classic Crew Cut", imageHint: "man crew cut", imagePlaceholder: "https://placehold.co/300x200.png" },
  { id: "modern-quiff", name: "Modern Quiff", imageHint: "man modern quiff", imagePlaceholder: "https://placehold.co/300x200.png" },
  { id: "textured-crop", name: "Textured Crop", imageHint: "woman textured crop", imagePlaceholder: "https://placehold.co/300x200.png" },
  { id: "slick-back-undercut", name: "Slick Back Undercut", imageHint: "man slick back", imagePlaceholder: "https://placehold.co/300x200.png" },
  { id: "layered-bob", name: "Layered Bob", imageHint: "woman layered bob", imagePlaceholder: "https://placehold.co/300x200.png" },
  { id: "pixie-cut", name: "Pixie Cut", imageHint: "woman pixie cut", imagePlaceholder: "https://placehold.co/300x200.png" },
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
  const [currentTryOnStyleName, setCurrentTryOnStyleName] = useState<string | null>(null);
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
        setAiSuggestion(null); // Clear previous AI suggestion
        setGeneratedTryOnImageURL(null); // Clear previous try-on image
        setCurrentTryOnStyleName(null);
        if (showWebcam) stopWebcam(); 
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = useCallback(async () => {
    setShowWebcam(true);
    setUserPhotoDataUri(null); 
    setAiSuggestion(null);
    setGeneratedTryOnImageURL(null);
    setCurrentTryOnStyleName(null);
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
    // Ensure webcam is stopped if component unmounts or showWebcam becomes false
    return () => {
        stopWebcam();
    };
  }, [stopWebcam]);


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
      setCurrentTryOnStyleName(null);
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

    setTimeout(() => {
      const mockFaceShapes = ["Oval", "Round", "Square", "Heart"];
      const randomFaceShape = mockFaceShapes[Math.floor(Math.random() * mockFaceShapes.length)];
      const suggestedName = `Mock ${selectedStyleType} ${randomFaceShape} Cut`;
      
      const mockResult: MockDiagnoseFaceSuggestHairstyleOutput = {
        detectedFaceShape: randomFaceShape,
        suggestedHairstyleName: suggestedName,
        suggestedHairstyleDescription: `This is a mock description for a ${suggestedName}. It's designed for a ${randomFaceShape.toLowerCase()} face and a ${selectedStyleType.toLowerCase()} vibe, offering a stylish yet manageable look.`,
        hairstyleVisualizationImagePrompt: `photorealistic image of a ${suggestedName} hairstyle, suitable for ${randomFaceShape} face shape, ${selectedStyleType} style`,
      };
      setAiSuggestion(mockResult);
      setCurrentTryOnStyleName(mockResult.suggestedHairstyleName); // Set this for the try-on button context
      toast({ title: "AI Suggestion Ready!", description: `Our AI stylist (mock) thinks a ${mockResult.suggestedHairstyleName} would look great!`});
      setLoadingAISuggestion(false);
    }, 2000); 
  };

  const handleGenerateTryOnImage = async (hairstyleName: string) => {
    if (!userPhotoDataUri) {
      toast({ title: "Missing Photo", description: "Please provide your photo first to visualize a hairstyle.", variant: "destructive" });
      return;
    }
    if (!hairstyleName) {
        toast({ title: "Missing Hairstyle", description: "No hairstyle specified for visualization.", variant: "destructive" });
        return;
    }
    setLoadingTryOnImage(true);
    setGeneratedTryOnImageURL(null); // Clear previous image
    setCurrentTryOnStyleName(hairstyleName); // Update current style being tried on

    // If this try-on is for an AI suggested style, we might not need to clear aiSuggestion.
    // If it's for a predefined style, aiSuggestion might not be relevant for this specific try-on.
    // For simplicity, we're assuming the main visualization area shows the current "try-on" attempt.
    // If this call comes from a predefined style, aiSuggestion might naturally be null or for a different style.
    // Consider if `aiSuggestion` should be cleared if trying on a predefined style. For now, it's not explicitly cleared here.

    setTimeout(() => {
      const placeholderUrl = `https://placehold.co/400x400.png?text=Try-On:${hairstyleName.substring(0,10).replace(/\s/g,'+')}&font=lora`;
      setGeneratedTryOnImageURL(placeholderUrl);
      toast({ title: "Visualization Ready!", description: `Here's how a ${hairstyleName} might look on you (mock image).` });
      setLoadingTryOnImage(false);
    }, 3000); 
  };

  const handleBookStyle = (styleName: string) => {
    if (!styleName) {
        toast({title: "No style selected", description: "Please select or get a style suggestion to book.", variant: "destructive"});
        return;
    }
    router.push(`/barbers?style=${encodeURIComponent(styleName)}`);
  };

  const clearPhotoAndSuggestions = () => {
    setUserPhotoDataUri(null);
    setAiSuggestion(null);
    setGeneratedTryOnImageURL(null);
    setCurrentTryOnStyleName(null);
    setAiError(null);
    if(showWebcam) stopWebcam();
  }

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
                            <AlertDescription>Please enable camera permissions in your browser settings to use the webcam.</AlertDescription>
                        </Alert>
                    )}
                     {hasCameraPermission === null && !cameraStream && ( 
                        <Alert variant="default" className="mt-2">
                            <AlertTitle>Requesting Camera</AlertTitle>
                            <AlertDescription>Attempting to access your webcam. Please allow permission when prompted.</AlertDescription>
                        </Alert>
                    )}
                    <div className="mt-4 flex gap-2">
                        <Button onClick={capturePhoto} disabled={hasCameraPermission !== true || !cameraStream}>Capture Photo</Button>
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

          {/* Combined Display Area for AI Suggestion and Try-On Image */}
          {(aiSuggestion || generatedTryOnImageURL || loadingTryOnImage) && (
            <Card className="bg-muted/50 p-4 sm:p-6 mt-6 shadow-md">
                {aiSuggestion && !generatedTryOnImageURL && !loadingTryOnImage && ( // Only show AI text if no try-on image is active/loading
                    <>
                        <CardTitle className="text-xl text-primary mb-1">AI Suggestion: {aiSuggestion.suggestedHairstyleName}</CardTitle>
                        <CardDescription className="mb-3">Detected Face Shape (Mock): <span className="font-semibold">{aiSuggestion.detectedFaceShape}</span></CardDescription>
                        <p className="text-foreground/90 mb-3">{aiSuggestion.suggestedHairstyleDescription}</p>
                        <p className="text-xs text-muted-foreground italic break-words mb-3">For visualization reference (Mock): &quot;{aiSuggestion.hairstyleVisualizationImagePrompt}&quot;</p>
                    </>
                )}

              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                    {/* Buttons always relate to the currentTryOnStyleName if available, or AI suggestion if that's the context */}
                    {(currentTryOnStyleName || aiSuggestion?.suggestedHairstyleName) && (
                         <Button 
                            onClick={() => handleGenerateTryOnImage(currentTryOnStyleName || aiSuggestion!.suggestedHairstyleName)} 
                            disabled={loadingTryOnImage || !userPhotoDataUri}
                            className="w-full"
                            variant="default"
                          >
                            {loadingTryOnImage && currentTryOnStyleName === (currentTryOnStyleName || aiSuggestion?.suggestedHairstyleName) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                            Visualize "{currentTryOnStyleName || aiSuggestion!.suggestedHairstyleName}" (Mock)
                          </Button>
                    )}
                     <Button 
                      onClick={() => handleBookStyle(currentTryOnStyleName || aiSuggestion?.suggestedHairstyleName || "Selected Style")}
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={!(currentTryOnStyleName || aiSuggestion?.suggestedHairstyleName)}
                    >
                      Book "{currentTryOnStyleName || aiSuggestion?.suggestedHairstyleName || "Selected Style"}" <ArrowRight className="ml-2 h-4 w-4" />
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
                      <p className="text-sm">Your AI-generated hairstyle visualization (mock) will appear here once you generate or try on a style.</p>
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
          {predefinedHairstyles.map((style) => (
            <Card key={style.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
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
              <CardContent className="p-4 pt-0 flex-grow">
                {/* Description for predefined styles can be added here if needed */}
              </CardContent>
              <CardFooter className="p-4 pt-0 mt-auto flex flex-col sm:flex-row gap-2">
                <Button 
                    className="w-full sm:w-1/2" 
                    variant="outline"
                    onClick={() => {
                        setAiSuggestion(null); // Clear AI suggestion context
                        handleGenerateTryOnImage(style.name);
                    }}
                    disabled={!userPhotoDataUri || loadingTryOnImage}
                >
                    <Eye className="mr-2 h-4 w-4"/> Try On (Mock)
                </Button>
                <Button className="w-full sm:w-1/2" onClick={() => handleBookStyle(style.name)}>
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

