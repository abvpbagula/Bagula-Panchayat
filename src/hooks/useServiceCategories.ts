import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_CATEGORIES, type ServiceCategoryDef } from "@/pages/Index";

export function useServiceCategories(): {
  categories: ServiceCategoryDef[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [categories, setCategories] = useState<ServiceCategoryDef[]>(SERVICE_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(false);

  const loadFromDb = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch categories from master_service_categories
      const { data: dbCategories } = await supabase
        .from("master_service_categories" as any)
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (dbCategories && dbCategories.length > 0) {
        const staticById = new Map(SERVICE_CATEGORIES.map((c) => [c.id, c]));
        const merged: ServiceCategoryDef[] = dbCategories.map((c: any) => {
          const staticMatch = staticById.get(c.id);
          return {
            id: c.id,
            name: c.name || staticMatch?.name || c.id,
            nameBn: c.name_bn || staticMatch?.nameBn || "",
            icon: c.icon || staticMatch?.icon || "📜",
            description: c.description || staticMatch?.description || "",
            services: staticMatch?.services || [],
          };
        });
        setCategories(merged.filter((c) => c.services.length > 0 || c.id === "elected-reps"));
      }
    } catch (err) {
      console.warn("Could not fetch database service categories, using cached baseline:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  return { categories, loading, refresh: loadFromDb };
}
