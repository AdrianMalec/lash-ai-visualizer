import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import lashClassic from "@/assets/lash-classic.jpg";
import lashVolume from "@/assets/lash-volume.jpg";
import lashCateye from "@/assets/lash-cateye.jpg";
import lashFox from "@/assets/lash-fox.jpg";
import lashDoll from "@/assets/lash-doll.jpg";
import lashWet from "@/assets/lash-wet.jpg";

const LOCAL_IMG: Record<string, string> = {
  classic: lashClassic,
  volume: lashVolume,
  cateye: lashCateye,
  fox: lashFox,
  doll: lashDoll,
  wet: lashWet,
};

export type LashStyle = { id: string; slug: string; name: string; description: string; img: string };

export const styleImage = (slug: string, url?: string | null) => url || LOCAL_IMG[slug] || lashClassic;

export const useStyles = () => {
  const [styles, setStyles] = useState<LashStyle[]>([]);
  useEffect(() => {
    supabase
      .from("lash_styles")
      .select("*")
      .order("sort_order")
      .then(({ data }) =>
        setStyles(
          (data ?? []).map((s) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            description: s.description,
            img: styleImage(s.slug, s.image_url),
          })),
        ),
      );
  }, []);
  return styles;
};

export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    const check = async (uid?: string) => {
      if (!uid) return setIsAdmin(false);
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin");
      setIsAdmin(!!data?.length);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => check(s?.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return isAdmin;
};
