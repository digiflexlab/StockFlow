
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportChat } from './SupportChat';

interface SupportButtonProps {
  user: any;
}

export const SupportButton = ({ user }: SupportButtonProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="px-4 py-2 border-t">
        <Button
          variant="ghost"
          className="w-full flex items-center gap-3 justify-start h-12"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <span className="text-gray-700">Support</span>
        </Button>
      </div>
      
      <SupportChat 
        user={user}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
};
