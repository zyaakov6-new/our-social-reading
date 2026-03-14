import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FriendProfile {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FriendItem {
  friendship: Friendship;
  profile: FriendProfile;
}

export interface UserSearchResult extends FriendProfile {
  friendshipStatus?: 'pending' | 'accepted' | 'rejected';
  friendshipId?: string;
  isRequester?: boolean;
}

export function useFriends() {
  const { user } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FriendProfile>>({});
  const [loading, setLoading] = useState(true);

  const fetchFriendships = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .neq('status', 'rejected');

      if (error) throw error;

      const mapped: Friendship[] = (data || []).map((f: any) => ({
        id: f.id,
        requesterId: f.requester_id,
        addresseeId: f.addressee_id,
        status: f.status,
        createdAt: f.created_at,
      }));
      setFriendships(mapped);

      const otherIds = [...new Set([
        ...mapped.map(f => f.requesterId),
        ...mapped.map(f => f.addresseeId),
      ])].filter(id => id !== user.id);

      if (otherIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', otherIds);

        const profileMap: Record<string, FriendProfile> = {};
        (profileData || []).forEach((p: any) => {
          profileMap[p.user_id] = {
            userId: p.user_id,
            displayName: p.display_name || 'קורא',
            avatarUrl: p.avatar_url,
          };
        });
        setProfiles(profileMap);
      }
    } catch (e) {
      console.error('Failed to load friendships', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  const sendRequest = async (addresseeId: string) => {
    if (!user) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'pending',
    });
    if (error) throw error;
    await fetchFriendships();
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    if (error) throw error;
    await fetchFriendships();
  };

  const rejectRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    if (error) throw error;
    await fetchFriendships();
  };

  const unfriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) throw error;
    await fetchFriendships();
  };

  const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    if (!user || !query.trim()) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .ilike('display_name', `%${query}%`)
      .neq('user_id', user.id)
      .limit(10);

    if (error) throw error;

    return (data || []).map((p: any) => {
      const existing = friendships.find(
        f => f.requesterId === p.user_id || f.addresseeId === p.user_id
      );
      return {
        userId: p.user_id,
        displayName: p.display_name || 'קורא',
        avatarUrl: p.avatar_url,
        friendshipStatus: existing?.status,
        friendshipId: existing?.id,
        isRequester: existing?.requesterId === user.id,
      };
    });
  };

  const friends: FriendItem[] = friendships
    .filter(f => f.status === 'accepted')
    .map(f => {
      const otherId = f.requesterId === user?.id ? f.addresseeId : f.requesterId;
      return { friendship: f, profile: profiles[otherId] };
    })
    .filter((f): f is FriendItem => !!f.profile);

  const incomingRequests: FriendItem[] = friendships
    .filter(f => f.status === 'pending' && f.addresseeId === user?.id)
    .map(f => ({ friendship: f, profile: profiles[f.requesterId] }))
    .filter((f): f is FriendItem => !!f.profile);

  const outgoingRequests: FriendItem[] = friendships
    .filter(f => f.status === 'pending' && f.requesterId === user?.id)
    .map(f => ({ friendship: f, profile: profiles[f.addresseeId] }))
    .filter((f): f is FriendItem => !!f.profile);

  return {
    loading,
    friends,
    incomingRequests,
    outgoingRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    unfriend,
    searchUsers,
    refetch: fetchFriendships,
  };
}
