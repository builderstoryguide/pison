'use client';

import { ReactNode, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  getUsersForChat,
} from '@/lib/actions/chat';

interface Participant {
  user: {
    id: string;
    avatar: string | null;
    name: string | null;
    email: string | null;
  }
}

interface ConversationType {
  id: string;
  updatedAt: Date;
  participants: Participant[];
  messages: { content: string; createdAt: Date }[];
}

interface ChatUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: { name: string } | null;
}

interface MessageType {
  id: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
    email: string | null;
  }
}

export function ChatSheet({ trigger }: { trigger: ReactNode }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Conversations
  const { data: convData, isLoading: isLoadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
    enabled: isOpen,
    refetchInterval: isOpen && !activeConversationId ? 5000 : false,
  });

  // Fetch users for new chat
  const { data: usersData } = useQuery({
    queryKey: ['usersForChat', searchQuery],
    queryFn: () => getUsersForChat(searchQuery),
    enabled: isOpen && !activeConversationId,
  });

  const startChatMutation = useMutation({
    mutationFn: (userId: string) => createConversation([userId]),
    onSuccess: (res) => {
      if (res.success && res.conversation) {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        setActiveConversationId(res.conversation.id);
      } else {
        toast.error(res.error || 'Failed to start chat');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start chat');
    },
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[450px] sm:max-w-none inset-5 start-auto h-auto rounded-lg p-0 sm:max-w-none [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5 flex flex-col">
        {activeConversationId ? (
          <ActiveChat
            conversationId={activeConversationId}
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <ChatList
            currentUserId={session?.user?.id ?? null}
            conversations={(convData?.conversations || []) as ConversationType[]}
            users={(usersData?.users || []) as ChatUser[]}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectConversation={setActiveConversationId}
            onStartChat={(id) => startChatMutation.mutate(id)}
            isLoading={isLoadingConvs}
            isStartingChat={startChatMutation.isPending}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ChatList({
  currentUserId,
  conversations,
  users,
  searchQuery,
  setSearchQuery,
  onSelectConversation,
  onStartChat,
  isLoading,
  isStartingChat,
}: {
  currentUserId: string | null;
  conversations: ConversationType[];
  users: ChatUser[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSelectConversation: (id: string) => void;
  onStartChat: (id: string) => void;
  isLoading: boolean;
  isStartingChat?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <SheetHeader>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <SheetTitle>{t('pages.topbar.chat.title') || 'Messages'}</SheetTitle>
        </div>
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search or start new chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </SheetHeader>
      <SheetBody className="scrollable-y-auto grow p-0">
        <div className="p-3 flex flex-col gap-6">
          {!searchQuery && (
            <div>
              <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider px-2">Recent Chats</h4>
              <div className="flex flex-col gap-1">
                {isLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground px-2">No recent chats</div>
                ) : (
                  conversations.map((conv) => {
                    const otherParticipant = conv.participants.find(
                      (p: Participant) => p.user && p.user.id !== currentUserId
                    )?.user;

                    const lastMessage = conv.messages?.[0];

                    return (
                      <div
                        key={conv.id}
                        onClick={() => onSelectConversation(conv.id)}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={otherParticipant?.avatar || ''} />
                          <AvatarFallback>{otherParticipant?.name?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden w-full">
                          <div className="flex justify-between items-center w-full">
                            <span className="font-medium truncate">{otherParticipant?.name || 'Chat'}</span>
                            {lastMessage && (
                              <span className="text-xs text-muted-foreground shrink-0 ms-2">
                                {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground truncate block">
                            {lastMessage?.content || 'New conversation'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider px-2">
              {searchQuery ? 'Search Results' : 'Other Contacts'}
            </h4>
            <div className="flex flex-col gap-1">
              {users.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground px-2">No contacts found</div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => !isStartingChat && onStartChat(user.id)}
                    className={cn(
                      'flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors',
                      isStartingChat && 'pointer-events-none opacity-60'
                    )}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar || ''} />
                      <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden w-full">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium truncate">{user.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground truncate block">{user.role?.name || 'User'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetBody>
    </>
  );
}

function ActiveChat({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await getMessages(conversationId);
      if (!res.success) throw new Error(res.error || 'Failed to load messages');
      return res;
    },
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(conversationId, text),
    onSuccess: (res) => {
      if (res.success) {
        setText('');
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } else {
        toast.error(res.error || t('pages.validation.approveFailed'));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  const messages = (data?.messages || []) as MessageType[];

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">Chat</span>
          </div>
        </div>
      </SheetHeader>

      <SheetBody className="scrollable-y-auto grow p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground mt-4">Loading messages...</div>
        ) : isError ? (
          <div className="text-center text-sm text-destructive mt-4">
            {t('pages.validation.fetchPendingFailed') || 'Failed to load messages'}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn("flex items-end gap-2 px-2")}>
              <Avatar className="w-8 h-8 shrink-0 mb-1">
                <AvatarImage src={msg.sender?.avatar || ''} />
                <AvatarFallback>{msg.sender?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground ml-1 mb-1">{msg.sender?.name}</span>
                <div className="bg-accent/60 text-foreground text-sm font-medium p-3 rounded-2xl rounded-bl-sm">
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 ml-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </SheetBody>

      <div className="p-4 border-t border-border bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) sendMutation.mutate();
          }}
          className="flex items-center gap-2 relative"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 pr-12 rounded-full h-11"
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1 w-9 h-9 rounded-full"
            disabled={sendMutation.isPending || !text.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
