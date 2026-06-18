import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <section className="w-full max-w-xl text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
          <SearchX className="size-7" aria-hidden="true" />
        </div>

        <p className="mt-8 text-sm font-medium text-primary">404</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          This frame is out of bounds.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground">
          The page you are looking for does not exist, or the link has moved out of the PixelForge workspace.
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to PixelForge
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
