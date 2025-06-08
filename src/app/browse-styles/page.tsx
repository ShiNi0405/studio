
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, Loader2, ImageIcon, Camera, UploadCloud, RotateCcw, Eye, User, Users, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MENS_HAIRCUT_OPTIONS, WOMENS_HAIRCUT_OPTIONS, type HaircutOptionConfig } from '@/config/hairstyleOptions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function BrowseStylesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [userPhotoDataUri, setUserPhotoDataUri] = useState<string | null>(null);
  
  const [generatedTryOnImageURL, setGeneratedTryOnImageURL] = useState<string | null>(null);
  const [currentTryOnStyleName, setCurrentTryOnStyleName] = useState<string | null>(null); 
  const [currentTryOnOptionId, setCurrentTryOnOptionId] = useState<string | null>(null); 
  const [loadingTryOnImage, setLoadingTryOnImage] = useState(false);

  const [showWebcam, setShowWebcam] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const popularMenStyles: HaircutOptionConfig[] = MENS_HAIRCUT_OPTIONS.filter(opt => !opt.isCustom);
  const popularWomenStyles: HaircutOptionConfig[] = WOMENS_HAIRCUT_OPTIONS.filter(opt => !opt.isCustom);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserPhotoDataUri(e.target?.result as string);
        setGeneratedTryOnImageURL(null); // Clear previous try-on when photo changes
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
      setGeneratedTryOnImageURL(null); // Clear try-on when new photo captured
      setCurrentTryOnStyleName(null);
      setCurrentTryOnOptionId(null);
      stopWebcam(); 
    }
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

    // Mock AI Image Generation (Try-On)
    setTimeout(() => {
      const placeholderText = `Try-On:\n${hairstyleName.substring(0,20).replace(/\s/g,'+')}`;
      const placeholderUrl = `https://placehold.co/400x400.png?text=${encodeURIComponent(placeholderText)}&font=lora`;
      setGeneratedTryOnImageURL(placeholderUrl);
      toast({ title: "Visualization Ready!", description: `Here's how a ${hairstyleName} might look on you (mock image).` });
      setLoadingTryOnImage(false);
    }, 2000); 
  };

  const handleBookTryOnStyle = () => {
    if (!currentTryOnStyleName) {
        toast({title: "No style selected for try-on", description: "Please try on a style first.", variant: "destructive"});
        return;
    }
    
    let queryString = `style=${encodeURIComponent(currentTryOnStyleName)}`;
    if (currentTryOnOptionId) {
        queryString += `&haircutOptionId=${encodeURIComponent(currentTryOnOptionId)}`;
    }
    router.push(`/barbers?${queryString}`);
  };

  const handleBookDirectStyle = (styleName: string, optionId: string) => {
    let queryString = `style=${encodeURIComponent(styleName)}`;
    queryString += `&haircutOptionId=${encodeURIComponent(optionId)}`;
    router.push(`/barbers?${queryString}`);
  }

  const clearPhotoAndTryOn = () => {
    setUserPhotoDataUri(null);
    setGeneratedTryOnImageURL(null);
    setCurrentTryOnStyleName(null);
    setCurrentTryOnOptionId(null);
    if(showWebcam) stopWebcam();
  }
  
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-10">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
          <CardTitle className="text-3xl font-headline flex items-center"><Palette className="w-8 h-8 mr-3 text-primary"/>Virtual Hairstyle Try-On</CardTitle>
          <CardDescription>Upload your photo or use your webcam to see how different popular hairstyles might look on you. Then, find a barber who can make it real!</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Photo Upload and Display Section */}
            <div className="space-y-4">
              <Label className="text-md font-semibold block">Step 1: Provide Your Photo</Label>
              {!userPhotoDataUri && !showWebcam && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button variant="outline" onClick={() => document.getElementById('photoUploadBrowse')?.click()} className="py-6 text-base">
                          <UploadCloud className="mr-2 h-5 w-5"/> Upload Photo
                      </Button>
                      <Input type="file" id="photoUploadBrowse" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <Button variant="outline" onClick={startWebcam} className="py-6 text-base">
                          <Camera className="mr-2 h-5 w-5"/> Use Webcam
                      </Button>
                  </div>
              )}
              
              {showWebcam && !userPhotoDataUri && (
                  <Card className="p-4 border">
                      <CardTitle className="text-lg mb-2">Webcam Preview</CardTitle>
                      <video ref={videoRef} className="w-full aspect-video rounded-md bg-slate-200" autoPlay playsInline muted />
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
                <div className="text-center space-y-3">
                  <p className="font-medium text-muted-foreground">Your Photo:</p>
                  <Image src={userPhotoDataUri} alt="Your photo" data-ai-hint="user portrait" width={250} height={250} className="rounded-lg mx-auto shadow-md aspect-square object-cover" />
                  <Button variant="outline" size="sm" onClick={clearPhotoAndTryOn}><RotateCcw className="mr-2 h-4 w-4"/>Change Photo / Reset</Button>
                </div>
              )}
            </div>

            {/* Try-On Result Section */}
            <div className="space-y-3">
                 <Label className="text-md font-semibold block">Step 2: See Your (Mock) Try-On Here</Label>
                 <Card className="relative aspect-square rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center shadow-inner min-h-[250px] p-4">
                  {loadingTryOnImage ? (
                     <div className="text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Visualizing "{currentTryOnStyleName}" (mock)...</p>
                     </div>
                  ) : generatedTryOnImageURL ? (
                    <>
                      <Image src={generatedTryOnImageURL} alt={`AI try-on for: ${currentTryOnStyleName}`} data-ai-hint="hairstyle try on mock" fill style={{ objectFit: 'cover' }} />
                       <CardFooter className="absolute bottom-0 left-0 right-0 bg-black/60 p-3">
                           <Button 
                            onClick={handleBookTryOnStyle}
                            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                            disabled={!currentTryOnStyleName}
                            >
                            Book This Look: "{currentTryOnStyleName}" <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                       </CardFooter>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50"/>
                      <p className="text-sm">Your virtual try-on (mock) will appear here after you select a style below and click "Try On".</p>
                      {!userPhotoDataUri && <p className="text-xs mt-1">(Please upload a photo first)</p>}
                    </div>
                  )}
                </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 pt-6">
        <div className="text-center">
          <h2 className="text-2xl font-headline text-primary">Step 3: Choose From Popular Styles</h2>
          <p className="text-muted-foreground">Browse these common hairstyles, try them on with your photo, and book directly.</p>
        </div>
        <Tabs defaultValue="men-options" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="men-options"><User className="mr-2"/>Men's Options ({popularMenStyles.length})</TabsTrigger>
                <TabsTrigger value="women-options"><Users className="mr-2"/>Women's Options ({popularWomenStyles.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="men-options" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                {popularMenStyles.map((style) => (
                    <Card key={style.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col items-center p-4 text-center">
                        <div className="relative aspect-square w-3/4 mb-3 rounded-md overflow-hidden bg-slate-100">
                            <Image 
                                src={style.exampleImageUrl || `https://placehold.co/150x150.png?text=${encodeURIComponent(style.name.substring(0,10))}`}
                                alt={style.name} 
                                data-ai-hint={style.defaultImageHint || `men ${style.name} hairstyle`} 
                                fill
                                style={{objectFit: "cover"}}
                                className="transition-transform group-hover:scale-105" 
                            />
                        </div>
                        <CardTitle className="text-lg mb-3">{style.name}</CardTitle>
                        <CardFooter className="p-0 w-full flex flex-col sm:flex-row gap-2">
                            <Button 
                                className="w-full flex-1" 
                                variant="outline"
                                onClick={() => handleGenerateTryOnImage(style.name, style.id)}
                                disabled={!userPhotoDataUri || loadingTryOnImage}
                            >
                                <Eye className="mr-2 h-4 w-4"/> Try On (Mock)
                            </Button>
                            <Button className="w-full flex-1" onClick={() => handleBookDirectStyle(style.name, style.id)}>
                            Book Style <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                </div>
            </TabsContent>
            <TabsContent value="women-options" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                {popularWomenStyles.map((style) => (
                    <Card key={style.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col items-center p-4 text-center">
                        <div className="relative aspect-square w-3/4 mb-3 rounded-md overflow-hidden bg-slate-100">
                            <Image 
                                src={style.exampleImageUrl || `https://placehold.co/150x150.png?text=${encodeURIComponent(style.name.substring(0,10))}`}
                                alt={style.name} 
                                data-ai-hint={style.defaultImageHint || `women ${style.name} hairstyle`} 
                                fill
                                style={{objectFit: "cover"}}
                                className="transition-transform group-hover:scale-105" 
                            />
                        </div>
                        <CardTitle className="text-lg mb-3">{style.name}</CardTitle>
                        <CardFooter className="p-0 w-full flex flex-col sm:flex-row gap-2">
                            <Button 
                                className="w-full flex-1" 
                                variant="outline"
                                onClick={() => handleGenerateTryOnImage(style.name, style.id)}
                                disabled={!userPhotoDataUri || loadingTryOnImage}
                            >
                                <Eye className="mr-2 h-4 w-4"/> Try On (Mock)
                            </Button>
                            <Button className="w-full flex-1" onClick={() => handleBookDirectStyle(style.name, style.id)}>
                            Book Style <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                </div>
            </TabsContent>
        </Tabs>
      </div>
       <div className="text-center mt-12">
         <Button variant="link" onClick={() => router.push('/')}>Back to Home</Button>
      </div>
    </div>
  );
}

    