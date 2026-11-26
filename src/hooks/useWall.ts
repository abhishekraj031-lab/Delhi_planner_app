import { useCallback, useEffect, useRef, useState } from 'react';
import { Comment, Post, loadWall, newId, removePhoto, saveWall, savePhoto } from '../lib/wall';

/** The wall on this phone: sample posts plus the person's own. Posts are saved on the device only for now. */
export function useWall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const ref = useRef<Post[]>([]);
  useEffect(() => { loadWall().then((p) => { ref.current = p; setPosts(p); }); }, []);
  const commit = useCallback((next: Post[]) => { ref.current = next; setPosts(next); saveWall(next); }, []);

  const addPost = useCallback((a: { author: string; photo: string; placeId?: string; caption: string }) => {
    const id = newId();
    savePhoto(id, a.photo);
    commit([{ id, author: a.author, mine: true, placeId: a.placeId, caption: a.caption, t: Date.now(), photo: a.photo, likes: 0, liked: false, comments: [] }, ...ref.current]);
  }, [commit]);
  const toggleLike = useCallback((id: string) => {
    commit(ref.current.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)));
  }, [commit]);
  const addComment = useCallback((id: string, who: string, text: string) => {
    const c: Comment = { id: newId(), who, text, t: Date.now() };
    commit(ref.current.map((p) => (p.id === id ? { ...p, comments: [...p.comments, c] } : p)));
  }, [commit]);
  const removePost = useCallback((id: string) => { removePhoto(id); commit(ref.current.filter((p) => p.id !== id)); }, [commit]);
  return { posts, addPost, toggleLike, addComment, removePost };
}
