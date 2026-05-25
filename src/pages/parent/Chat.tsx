import { BottomTabs } from "@/components/parent/BottomTabs";
import { MessageCircle } from "lucide-react";

const Chat = () => (
  <div className="min-h-screen bg-secondary/40 flex justify-center">
    <div className="w-full max-w-md bg-background min-h-screen pb-24 flex flex-col">
      <header className="px-5 py-4 border-b border-border">
        <h1 className="font-display text-lg font-bold">Chat</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm font-semibold">Driver chat is coming soon</p>
        <p className="text-xs text-muted-foreground mt-1">You'll be able to message your child's driver here.</p>
      </div>
    </div>
    <BottomTabs />
  </div>
);

export default Chat;
