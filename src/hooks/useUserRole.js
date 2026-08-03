import { useAuth } from "@/lib/AuthContext";

export function useUserRole() {
  const { user } = useAuth();

  // El rol se resuelve EXCLUSIVAMENTE desde user_type — sin fallback al rol
  // interno de base44 ni al estatus de owner del workspace.
  const isAdmin = user?.user_type === "admin";
  const isCliente = user?.user_type === "cliente";
  const isEditor = !isAdmin && !isCliente;

  const assignedArtistIds = user?.assigned_artist_ids || [];
  const canSeeAll = isAdmin || isEditor;

  const filterProfilesByAccess = (profiles) => {
    if (canSeeAll) return profiles;
    if (isCliente && assignedArtistIds.length > 0) {
      return profiles.filter(p =>
        (p.artist_ids || []).some(id => assignedArtistIds.includes(id))
      );
    }
    return [];
  };

  const filterPostsByAccess = (posts, accessibleProfileIds) => {
    if (canSeeAll) return posts;
    const idSet = new Set(accessibleProfileIds);
    return posts.filter(p => idSet.has(p.profile_id));
  };

  return {
    user,
    isAdmin,
    isCliente,
    isEditor,
    assignedArtistIds,
    canSeeAll,
    filterProfilesByAccess,
    filterPostsByAccess,
  };
}