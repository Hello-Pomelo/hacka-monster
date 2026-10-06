import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-6" />
          </div>
          <CardTitle className="text-2xl">Hacka Monster</CardTitle>
          <CardDescription>
            Votre community manager virtuel : des posts LinkedIn prêts à
            publier, dans le ton de l&apos;entreprise.
          </CardDescription>
          <Badge variant="secondary" className="mx-auto">
            En construction
          </Badge>
        </CardHeader>
      </Card>
    </main>
  );
}
