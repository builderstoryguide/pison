'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { getServerSession } from 'next-auth';

// Roles allowed to use chat: Manager, Accountant, Agent
const CHAT_ALLOWED_ROLE_SLUGS = ['manager', 'accountant', 'agent'] as const;

// Utility to get current user ID
const getCurrentUserId = async () => {
    const session = await getServerSession(authOptions);
    return session?.user?.id;
};

// Get current user with role for chat authorization
const getCurrentUserWithRole = async () => {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: { select: { slug: true } } },
    });
    return user;
};

export async function getConversations() {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Unauthorized');

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                email: true,
                                role: {
                                    select: { name: true },
                                },
                            },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return { success: true, conversations };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getMessages(conversationId: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Unauthorized');

        // Verify user is part of the conversation
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId,
                },
            },
        });

        if (!participant) throw new Error('Unauthorized or conversation not found');

        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        // Update lastReadAt
        await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { lastReadAt: new Date() },
        });

        return { success: true, messages };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function sendMessage(conversationId: string, content: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('Unauthorized');

        // Verify user is a participant in the conversation
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId,
                },
            },
        });
        if (!participant) throw new Error('Unauthorized or conversation not found');

        // Create the message
        const message = await prisma.message.create({
            data: {
                content,
                conversationId,
                senderId: userId,
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        revalidatePath('/(protected)/chat', 'layout'); // or wherever the chat is

        return { success: true, message };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createConversation(participantIds: string[]) {
    try {
        const currentUser = await getCurrentUserWithRole();
        if (!currentUser) throw new Error('Unauthorized');

        const roleSlug = currentUser.role?.slug?.toLowerCase();
        if (!roleSlug || !CHAT_ALLOWED_ROLE_SLUGS.includes(roleSlug as (typeof CHAT_ALLOWED_ROLE_SLUGS)[number])) {
            throw new Error('You are not allowed to start chats');
        }

        const allParticipantIds = Array.from(new Set([...participantIds, currentUser.id]));

        if (allParticipantIds.length < 2) {
            throw new Error('Need at least two participants');
        }

        // Verify all participants are chat-eligible (Manager, Accountant, Agent)
        const otherParticipantIds = allParticipantIds.filter((id) => id !== currentUser.id);
        const allowedParticipants = await prisma.user.findMany({
            where: {
                id: { in: otherParticipantIds },
                status: 'ACTIVE',
                isTrashed: false,
                role: { slug: { in: [...CHAT_ALLOWED_ROLE_SLUGS] } },
            },
            select: { id: true },
        });
        const allowedIds = new Set(allowedParticipants.map((p) => p.id));
        const invalidIds = otherParticipantIds.filter((id) => !allowedIds.has(id));
        if (invalidIds.length > 0) {
            throw new Error('One or more participants are not allowed to chat');
        }

        // Check if an exact conversation between these users already exists (for 1-on-1)
        if (allParticipantIds.length === 2) {
            const existingConversations = await prisma.conversation.findMany({
                where: {
                    AND: allParticipantIds.map((id) => ({
                        participants: { some: { userId: id } },
                    })),
                },
                include: {
                    participants: true,
                },
            });

            const exactMatch = existingConversations.find(
                (c) => c.participants.length === 2
            );

            if (exactMatch) {
                return { success: true, conversation: exactMatch };
            }
        }

        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: allParticipantIds.map((id) => ({
                        userId: id,
                    })),
                },
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } },
                    },
                },
            },
        });

        revalidatePath('/');
        return { success: true, conversation };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getUsersForChat(searchQuery?: string) {
    try {
        const currentUser = await getCurrentUserWithRole();
        if (!currentUser) throw new Error('Unauthorized');

        const roleSlug = currentUser.role?.slug?.toLowerCase();
        if (!roleSlug || !CHAT_ALLOWED_ROLE_SLUGS.includes(roleSlug as (typeof CHAT_ALLOWED_ROLE_SLUGS)[number])) {
            return { success: true, users: [] };
        }

        // Manager, Accountant, Agent can chat with each other
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUser.id },
                status: 'ACTIVE',
                isTrashed: false,
                role: {
                    slug: { in: [...CHAT_ALLOWED_ROLE_SLUGS] },
                },
                ...(searchQuery
                    ? {
                        OR: [
                            { name: { contains: searchQuery, mode: 'insensitive' } },
                            { email: { contains: searchQuery, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: { select: { name: true } },
            },
            take: 20,
        });

        return { success: true, users };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
