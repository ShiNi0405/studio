
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Loader2, ImageIcon, Camera, UploadCloud, RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MENS_HAIRCUT_OPTIONS, WOMENS_HAIRCUT_OPTIONS, type HaircutOptionConfig } from '@/config/hairstyleOptions';

interface AISuggestion {
  detectedFaceShape: string;
  suggestedHairstyleName: string;
  suggestedHairstyleDescription: string;
  hairstyleImageURL: string; // URL for the image of the hairstyle itself
  hairstyleOptionId?: string; // To link to a predefined option if applicable
}

export default function AIHairstyleSuggestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [userPhotoDataUri, setUserPhotoDataUri] = useState<string | null>(null);
  const [selectedStyleType, setSelectedStyleType] = useState<string>('');

  const [aiSuggestion, setAISuggestion] = useState<AISuggestion | null>(null);
  const [loadingAISuggestion, setLoadingAISuggestion] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  const [generatedTryOnImageURL, setGeneratedTryOnImageURL] = useState<string | null>(null);
  const [currentTryOnStyleName, setCurrentTryOnStyleName] = useState<string | null>(null);
  const [currentTryOnOptionId, setCurrentTryOnOptionId] = useState<string | null>(null);
  const [loadingTryOnImage, setLoadingTryOnImage] = useState(false);

  const [showWebcam, setShowWebcam] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const clearAll = () => {
    setUserPhotoDataUri(null);
    setSelectedStyleType('');
    setAISuggestion(null);
    setAIError(null);
    setGeneratedTryOnImageURL(null);
    setCurrentTryOnStyleName(null);
    setCurrentTryOnOptionId(null);
    if (showWebcam) stopWebcam();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    clearAll();
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setUserPhotoDataUri(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const stopWebcam = useCallback(() => {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    setCameraStream(null);
    setShowWebcam(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [cameraStream]);

  const startWebcam = useCallback(async () => {
    clearAll();
    setShowWebcam(true);
    setHasCameraPermission(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setHasCameraPermission(true);
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Webcam Not Supported' });
      setShowWebcam(false);
    }
  }, [toast]);

  useEffect(() => {
    return () => { if (cameraStream) cameraStream.getTracks().forEach(track => track.stop()); };
  }, [cameraStream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraStream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      setUserPhotoDataUri(canvas.toDataURL('image/png'));
      stopWebcam();
    }
  };

  const handleGetAISuggestion = async () => {
    if (!userPhotoDataUri) {
      toast({ title: "Missing Photo", description: "Please provide your photo first.", variant: "destructive" });
      return;
    }
    if (!selectedStyleType) {
      toast({ title: "Missing Style Type", description: "Please select your preferred style type.", variant: "destructive" });
      return;
    }
    setLoadingAISuggestion(true);
    setAIError(null);
    setAISuggestion(null);
    setGeneratedTryOnImageURL(null); // Clear previous try-on

    // Mock AI Logic
    setTimeout(() => {
      const allStyles = [...MENS_HAIRCUT_OPTIONS, ...WOMENS_HAIRCUT_OPTIONS].filter(opt => !opt.isCustom);
      const randomStyle = allStyles[Math.floor(Math.random() * allStyles.length)];
      
      const mockSuggestion: AISuggestion = {
        detectedFaceShape: "Oval", // Mock
        suggestedHairstyleName: randomStyle.name,
        suggestedHairstyleDescription: `This ${randomStyle.name} is a great fit for an ${selectedStyleType.toLowerCase()} look. It complements an oval face shape by adding volume and texture, framing your features elegantly.`,
        hairstyleImageURL: randomStyle.exampleImageUrl || `https://placehold.co/300x300.png?text=${encodeURIComponent(randomStyle.name.substring(0,15))}`,
        hairstyleOptionId: randomStyle.id,
      };
      setAISuggestion(mockSuggestion);
      setLoadingAISuggestion(false);
    }, 2000);
  };

  const handleGenerateTryOnForAISuggestion = () => {
    if (!userPhotoDataUri || !aiSuggestion) return;
    setCurrentTryOnStyleName(aiSuggestion.suggestedHairstyleName);
    setCurrentTryOnOptionId(aiSuggestion.hairstyleOptionId || null);
    setLoadingTryOnImage(true);
    setGeneratedTryOnImageURL(null);

    // Mock AI Image Generation (Try-On)
    setTimeout(() => {
      const placeholderText = `Try-On:\n${aiSuggestion.suggestedHairstyleName.substring(0,20).replace(/\s/g,'+')}`;
      const placeholderUrl = `https://placehold.co/400x400.png?text=${encodeURIComponent(placeholderText)}&font=lora`;
      setGeneratedTryOnImageURL(placeholderUrl);
      toast({ title: "Try-On Ready!", description: `Here's how ${aiSuggestion.suggestedHairstyleName} might look on you (mock image).` });
      setLoadingTryOnImage(false);
    }, 2000);
  };
  
  const handleBookTryOnStyle = () => {
    if (!currentTryOnStyleName) {
        toast({title: "No style selected for try-on", variant: "destructive"});
        return;
    }
    let queryString = `style=${encodeURIComponent(currentTryOnStyleName)}`;
    if (currentTryOnOptionId) {
        queryString += `&haircutOptionId=${encodeURIComponent(currentTryOnOptionId)}`;
    }
    router.push(`/barbers?${queryString}`);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-10">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <CardTitle className="text-3xl font-headline flex items-center"><Sparkles className="w-8 h-8 mr-3 text-primary"/>AI Hairstyle Advisor</CardTitle>
          <CardDescription>Upload your photo, select your style preferences, and let our AI suggest a hairstyle tailored for you. Then, visualize it with our mock try-on feature!</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Photo Upload and AI Controls */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-xl">Step 1: Your Photo</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {!userPhotoDataUri && !showWebcam && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button variant="outline" onClick={() => document.getElementById('photoUpload')?.click()} className="py-4 text-base">
                        <UploadCloud className="mr-2 h-5 w-5"/> Upload Photo
                      </Button>
                      <Input type="file" id="photoUpload" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <Button variant="outline" onClick={startWebcam} className="py-4 text-base">
                        <Camera className="mr-2 h-5 w-5"/> Use Webcam
                      </Button>
                    </div>
                  )}
                  {showWebcam && !userPhotoDataUri && (
                    <div className="p-1 border rounded-md">
                      <video ref={videoRef} className="w-full aspect-video rounded-md bg-slate-200" autoPlay playsInline muted />
                      {hasCameraPermission === false && <Alert variant="destructive" className="mt-2"><AlertTitle>Camera Access Denied</AlertTitle></Alert>}
                      <div className="mt-2 flex gap-2">
                        <Button onClick={capturePhoto} disabled={!cameraStream || hasCameraPermission !== true}>Capture</Button>
                        <Button variant="outline" onClick={stopWebcam}>Close Cam</Button>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {userPhotoDataUri && (
                    <div className="text-center space-y-2">
                      <Image src={userPhotoDataUri} alt="Your photo" data-ai-hint="user portrait" width={200} height={200} className="rounded-lg mx-auto shadow-md aspect-square object-cover" />
                      <Button variant="outline" size="sm" onClick={clearAll}><RotateCcw className="mr-2 h-4 w-4"/>Reset All</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {userPhotoDataUri && (
                <>
                  <Card>
                    <CardHeader><CardTitle className="text-xl">Step 2: Preferences</CardTitle></CardHeader>
                    <CardContent>
                      <Label htmlFor="styleType">Preferred Style Type</Label>
                      <Select value={selectedStyleType} onValueChange={setSelectedStyleType}>
                        <SelectTrigger id="styleType"><SelectValue placeholder="Select style type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Casual">Casual</SelectItem>
                          <SelectItem value="Trendy">Trendy</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Classic">Classic</SelectItem>
                          <SelectItem value="Edgy">Edgy</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                  <Button onClick={handleGetAISuggestion} disabled={loadingAISuggestion || !userPhotoDataUri || !selectedStyleType} className="w-full py-3 text-base">
                    {loadingAISuggestion ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Wand2 className="mr-2 h-5 w-5"/>}
                    Get AI Hairstyle Suggestion
                  </Button>
                </>
              )}
            </div>

            {/* Right Column: AI Suggestion and Try-On Result */}
            <div className="space-y-6">
              {loadingAISuggestion && (
                <Card className="text-center p-6"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" /><p>Getting your AI suggestion...</p></Card>
              )}
              {aiError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{aiError}</AlertDescription></Alert>}
              
              {aiSuggestion && !loadingAISuggestion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">AI Suggestion</CardTitle>
                    <CardDescription>Our AI thinks this style would look great on you!</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                       <Image src={aiSuggestion.hairstyleImageURL} alt={`Image of ${aiSuggestion.suggestedHairstyleName}`} data-ai-hint="hairstyle professional" width={200} height={200} className="rounded-lg mx-auto shadow-md aspect-square object-cover" />
                    </div>
                    <p><strong>Suggested Style:</strong> <span className="text-primary font-semibold">{aiSuggestion.suggestedHairstyleName}</span></p>
                    <p><strong>Detected Face Shape (Mock):</strong> {aiSuggestion.detectedFaceShape}</p>
                    <p className="text-sm"><strong>Reasoning (Mock):</strong> {aiSuggestion.suggestedHairstyleDescription}</p>
                     <Button onClick={handleGenerateTryOnForAISuggestion} className="w-full" variant="outline" disabled={loadingTryOnImage}>
                      {loadingTryOnImage && currentTryOnStyleName === aiSuggestion.suggestedHairstyleName ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                      Try This Suggested Style on My Photo
                    </Button>
                  </CardContent>
                </Card>
              )}

              {(generatedTryOnImageURL || loadingTryOnImage && currentTryOnStyleName) && (
                 <Card>
                    <CardHeader><CardTitle className="text-xl">Virtual Try-On Result</CardTitle></CardHeader>
                    <CardContent className="text-center space-y-3">
                        {loadingTryOnImage ? (
                            <div className="aspect-square bg-slate-200 flex flex-col items-center justify-center rounded-md p-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Visualizing "{currentTryOnStyleName}" on you (mock)...</p>
                            </div>
                        ) : generatedTryOnImageURL && currentTryOnStyleName ? (
                            <>
                                <Image src={generatedTryOnImageURL} alt={`AI try-on for: ${currentTryOnStyleName}`} data-ai-hint="hairstyle try on" width={300} height={300} className="rounded-lg mx-auto shadow-md aspect-square object-cover" />
                                <p className="font-medium text-lg">Your (Mock) Try-On: {currentTryOnStyleName}</p>
                                <Button onClick={handleBookTryOnStyle} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                                Book This Look <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </>
                        ) : null}
                    </CardContent>
                </Card>
              )}
               {(!aiSuggestion && !generatedTryOnImageURL && !loadingAISuggestion && !loadingTryOnImage && userPhotoDataUri) && (
                <Card className="text-center p-6 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                    <p>Your AI suggestion and virtual try-on will appear here.</p>
                    <p className="text-xs mt-1">Complete steps 1 &amp; 2 and click "Get AI Hairstyle Suggestion".</p>
                </Card>
              )}


            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center mt-12">
         <Button variant="link" onClick={() => router.push('/')}>Back to Home</Button>
      </div>
    </div>
  );
}
