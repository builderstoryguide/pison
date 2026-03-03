'use client';

import { Archive, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ITabsProps {
  postId: number;
  activeTab: string;
  setActiveTab: (newTab: string) => void;
  comments: number;
  likes: string;
  saves: number;
  className?: string;
}

const Tabs = ({
  postId,
  activeTab,
  setActiveTab,
  comments,
  likes,
  saves,
  className,
}: ITabsProps) => {
  return (
    <div
      data-tabs="true"
      className={`flex flex-col sm:flex-row items-stretch sm:items-center flex-wrap gap-2.5 border-input border-t border-b border-dashed py-3 mb-4 ${className}`}
    >
      <Button
        variant={activeTab === 'comments' ? 'primary' : 'ghost'}
        className={`text-mono hover:text-primary-active text-sm border-primary/30 ${
          activeTab === 'comments'
            ? 'bg-primary/10 border text-primary hover:text-white hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/30'
            : ''
        }`}
        onClick={() => setActiveTab('comments')}
        data-tab-toggle={`#post_${postId}_comments`}
      >
        <MessageSquare /> {comments} Comments
      </Button>
      <Button
        variant={activeTab === 'likes' ? 'primary' : 'ghost'}
        className={`text-mono hover:text-primary-active text-sm border-primary/30 ${
          activeTab === 'likes'
            ? 'bg-primary/10 border text-primary hover:text-white hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/30'
            : ''
        }`}
        onClick={() => setActiveTab('likes')}
        data-tab-toggle={`#post_${postId}_likes`}
      >
        <Heart /> {likes} Likes
      </Button>
      <Button
        variant={activeTab === 'saves' ? 'primary' : 'ghost'}
        className={`text-mono hover:text-primary-active text-sm border-primary/30 ${
          activeTab === 'saves'
            ? 'bg-primary/10 border text-primary hover:text-white hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/30'
            : ''
        }`}
        onClick={() => setActiveTab('saves')}
        data-tab-toggle={`#post_${postId}_saves`}
      >
        <Archive /> {saves} Saves
      </Button>
    </div>
  );
};

export { Tabs, type ITabsProps };
