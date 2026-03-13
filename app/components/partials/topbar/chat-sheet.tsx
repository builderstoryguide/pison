'use client';

import { ReactNode, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { ArrowLeft, Paperclip, Send, Search, Smile, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  type ChatAttachment,
} from '@/lib/actions/chat';

const EmojiPicker = dynamic(
  () => import('emoji-picker-react').then((m) => m.default),
  { ssr: false }
);

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

interface MessageAttachment {
  path: string;
  filename: string;
  mimeType?: string;
}

interface MessageType {
  id: string;
  content: string;
  attachments?: MessageAttachment[] | null;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
    email: string | null;
  };
}

export function ChatSheet({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
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
        toast.error(res.error || t('pages.topbar.chat.startChatFailed'));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.topbar.chat.startChatFailed'));
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
              placeholder={t('pages.topbar.chat.searchPlaceholder')}
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
              <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider px-2">{t('pages.topbar.chat.recentChats')}</h4>
              <div className="flex flex-col gap-1">
                {isLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">{t('common.messages.loading')}</div>
                ) : conversations.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground px-2">{t('pages.topbar.chat.noRecentChats')}</div>
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
                            {lastMessage?.content || t('pages.topbar.chat.newConversation')}
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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES =
  'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,.doc,.docx,.xls,.xlsx,.txt';

function ActiveChat({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);

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
    mutationFn: async () => {
      const attachments: ChatAttachment[] = [];
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId);
        const res = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || t('pages.topbar.chat.uploadFailed'));
        attachments.push({
          path: json.path,
          filename: json.filename,
          mimeType: json.mimeType,
        });
      }
      return sendMessage(conversationId, text, attachments.length ? attachments : undefined);
    },
    onSuccess: (res) => {
      if (res.success) {
        setText('');
        setPendingFiles([]);
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } else {
        toast.error(res.error || t('pages.validation.approveFailed'));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t('pages.topbar.chat.sendMessageFailed'));
    },
  });

  const messages = (data?.messages || []) as MessageType[];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const valid: File[] = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(t('pages.topbar.chat.fileTooLarge'));
        continue;
      }
      valid.push(f);
    }
    setPendingFiles((prev) => [...prev, ...valid].slice(0, 5));
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setText((prev) => prev + emojiData.emoji);
    setEmojiOpen(false);
  };

  const canSend = text.trim() || pendingFiles.length > 0;

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">{t('pages.topbar.chat.title')}</span>
          </div>
        </div>
      </SheetHeader>

      <SheetBody className="scrollable-y-auto grow p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground mt-4">
            {t('pages.topbar.chat.loadingMessages')}
          </div>
        ) : isError ? (
          <div className="text-center text-sm text-destructive mt-4">
            {t('pages.topbar.chat.loadMessagesFailed')}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn('flex items-end gap-2 px-2')}>
              <Avatar className="w-8 h-8 shrink-0 mb-1">
                <AvatarImage src={msg.sender?.avatar || ''} />
                <AvatarFallback>{msg.sender?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col max-w-[85%]">
                <span className="text-xs text-muted-foreground ml-1 mb-1">{msg.sender?.name}</span>
                <div className="bg-accent/60 text-foreground text-sm font-medium p-3 rounded-2xl rounded-bl-sm">
                  {msg.content && <span className="whitespace-pre-wrap break-words">{msg.content}</span>}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {(msg.attachments as MessageAttachment[]).map((att, i) => {
                        const [convId, filename] = att.path.split('/');
                        const url = `/api/chat/files/${convId}/${filename}`;
                        const isImage =
                          att.mimeType?.startsWith('image/') ??
                          /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.filename);
                        return isImage ? (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block max-w-[200px]"
                          >
                            <img
                              src={url}
                              alt={att.filename}
                              className="rounded max-h-32 object-cover"
                            />
                          </a>
                        ) : (
                          <a
                            key={i}
                            href={url}
                            download={att.filename}
                            className="text-primary hover:underline text-xs flex items-center gap-1"
                          >
                            <Paperclip className="w-3 h-3" />
                            {att.filename}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 ml-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </SheetBody>

      <div className="p-4 border-t border-border bg-background shrink-0">
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingFiles.map((file, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-sm"
              >
                {file.name}
                <button
                  type="button"
                  onClick={() => removePendingFile(i)}
                  className="p-0.5 hover:bg-muted rounded"
                  aria-label={t('common.buttons.remove')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) sendMutation.mutate();
          }}
          className="flex items-center gap-1 relative"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_FILE_TYPES}
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="w-9 h-9 rounded-full shrink-0"
            title={t('pages.topbar.chat.attachFile')}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="w-9 h-9 rounded-full shrink-0"
                title={t('pages.topbar.chat.addEmoji')}
              >
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0 border-0 z-[100]">
              <EmojiPicker onEmojiClick={handleEmojiClick} theme="auto" width={320} height={400} />
            </PopoverContent>
          </Popover>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('pages.topbar.chat.typeMessagePlaceholder')}
            className="flex-1 min-w-0 rounded-full h-11"
            disabled={sendMutation.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="w-9 h-9 rounded-full shrink-0"
            disabled={sendMutation.isPending || !canSend}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
