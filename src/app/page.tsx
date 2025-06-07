
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Search, SparklesIcon } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center space-y-12">
      <header className="mt-12 md:mt-20">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary">
          Welcome to Barbermatch
        </h1>
        <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
          Discover talented barbers, book appointments with ease, and elevate your grooming experience.
          Your perfect haircut is just a few clicks away.
        </p>
      </header>

      <section className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button size="lg" className="w-full text-lg py-8" asChild>
          <Link href="/barbers">
            <Search className="mr-3 h-6 w-6" />
            Find a Barber
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="w-full text-lg py-8" asChild>
          <Link href="/hairstyle-suggestion">
            <SparklesIcon className="mr-3 h-6 w-6" />
            AI Hairstyle Suggestion
          </Link>
        </Button>
      </section>

      <section className="grid md:grid-cols-3 gap-8 w-full max-w-5xl pt-10">
        <Card className="text-left transition-all-subtle hover:shadow-xl hover:scale-105">
          <CardHeader>
            <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scissors"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4h-4.5l-6 6M16 20h4.5l6-6"/><circle cx="6" cy="18" r="3"/><path d="M8.12 15.88 12 12"/></svg>
            </div>
            <CardTitle className="font-headline text-2xl">Expert Barbers</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Connect with skilled and reviewed barbers in your area. Read their profiles and find your perfect match.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-left transition-all-subtle hover:shadow-xl hover:scale-105">
          <CardHeader>
             <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-check"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="m16 20 2 2 4-4"/></svg>
            </div>
            <CardTitle className="font-headline text-2xl">Easy Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Seamless appointment scheduling. Check availability and book your slot in minutes.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="text-left transition-all-subtle hover:shadow-xl hover:scale-105">
          <CardHeader>
            <div className="p-3 bg-primary/10 rounded-full w-fit mb-3">
               <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
            </div>
            <CardTitle className="font-headline text-2xl">AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Get smart hairstyle suggestions based on your face shape and style preferences.
            </CardDescription>
          </CardContent>
        </Card>
      </section>

      <section className="w-full max-w-5xl pt-10">
        <Card className="bg-primary text-primary-foreground overflow-hidden">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-12 text-left">
              <h2 className="text-3xl font-headline font-bold">Are you a Barber?</h2>
              <p className="mt-3 opacity-90">
                Join our platform to showcase your skills, manage bookings, and connect with new clients.
                Grow your business with Barbermatch.
              </p>
              <Button variant="secondary" size="lg" className="mt-6 text-primary" asChild>
                <Link href="/signup?role=barber">
                  Join as a Barber <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="hidden md:block h-full">
              <Image
                src="https://placehold.co/600x400.png"
                alt="Barber working"
                data-ai-hint="barber styling"
                width={600}
                height={400}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </Card>
      </section>

      <footer className="py-12 text-muted-foreground text-sm">
        © {new Date().getFullYear()} Barbermatch. All rights reserved.
      </footer>
    </div>
  );
}
