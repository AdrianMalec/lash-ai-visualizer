import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Scanner } from "@/components/Scanner";
import { Gallery } from "@/components/Gallery";
import { Salons } from "@/components/Salons";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Scanner />
      <Gallery />
      <Salons />
      <Footer />
    </main>
  );
};

export default Index;
