import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ─── PASSIONS — base metadata. Variant tiles (Gal/Guy, Air/Ollie) are built below. ──
const PASSIONS = [
  { id: "biking_mountain", label: "Mountain Biking", fileSlug: "mountainbiking", category: "Cycling" },
  { id: "biking_road", label: "Road Biking", fileSlug: "roadbiking", category: "Cycling" },
  { id: "canoeing", label: "Canoeing", fileSlug: "canoeing", category: "Water Sports" },
  { id: "climbing", label: "Climbing", fileSlug: "climbing", genderVariant: true, category: "Climbing" },
  { id: "dirt_biking", label: "Dirt Biking", fileSlug: "dirtbiking", category: "Lifestyle" },
  { id: "fishing", label: "Fishing", fileSlug: "fishing", category: "Water Sports" },
  { id: "golfing", label: "Golfing", fileSlug: "golfing", genderVariant: true, category: "Golf" },
  { id: "hiking", label: "Hiking", fileSlug: "hiking", genderVariant: true, category: "Running & Hiking" },
  { id: "ice_climbing", label: "Climbing (Ice)", fileSlug: "iceclimbing", category: "Climbing" },
  { id: "kayaking", label: "Kayaking", fileSlug: "kayaking", category: "Water Sports" },
  { id: "meditation", label: "Meditation", fileSlug: "meditation", category: "Wellness" },
  { id: "running", label: "Running", fileSlug: "running", genderVariant: true, category: "Running & Hiking" },
  { id: "skateboarding", label: "Skateboarding", fileSlug: "skateboarding", styleVariant: { suffix: "ollie", label: "Ollie" }, category: "Board Sports" },
  { id: "skiing", label: "Skiing", fileSlug: "skiing", styleVariant: { suffix: "air", label: "Air" }, category: "Winter Sports" },
  { id: "snowboarding", label: "Snowboarding", fileSlug: "snowboarding", styleVariant: { suffix: "air", label: "Air" }, category: "Winter Sports" },
  { id: "surfing", label: "Surfing", fileSlug: "surfing", category: "Board Sports" },
  { id: "vanlife", label: "Van Life", fileSlug: "vanlife", category: "Lifestyle" },
  { id: "wanderlust", label: "Wanderlust", fileSlug: "wanderlust", category: "Lifestyle" },
  { id: "weight_lifting", label: "Weight Lifting", fileSlug: "weightlifting", category: "Wellness" },
  { id: "yoga", label: "Yoga", fileSlug: "yoga", category: "Wellness" },
];

const CATEGORY_ORDER = ["Winter Sports", "Board Sports", "Cycling", "Water Sports", "Climbing", "Running & Hiking", "Golf", "Wellness", "Lifestyle"];

function buildBadgeTiles(badgeStyle) {
  const tiles = [];
  PASSIONS.forEach((p) => {
    if (badgeStyle === "retro") {
      tiles.push({ key: `retro-${p.id}-base`, passion: p, variantSuffix: "", label: p.label, image: `/badges/retro-${p.fileSlug}.jpg` });
      return;
    }
    if (p.genderVariant) {
      tiles.push({ key: `classic-${p.id}-guy`, passion: p, variantSuffix: "guy", label: `${p.label} (Guy)`, image: `/badges/classic-${p.fileSlug}-guy.jpg` });
      tiles.push({ key: `classic-${p.id}-gal`, passion: p, variantSuffix: "gal", label: `${p.label} (Gal)`, image: `/badges/classic-${p.fileSlug}-gal.jpg` });
    } else if (p.styleVariant) {
      tiles.push({ key: `classic-${p.id}-base`, passion: p, variantSuffix: "", label: p.label, image: `/badges/classic-${p.fileSlug}.jpg` });
      tiles.push({ key: `classic-${p.id}-${p.styleVariant.suffix}`, passion: p, variantSuffix: p.styleVariant.suffix, label: `${p.label} ${p.styleVariant.label}`, image: `/badges/classic-${p.fileSlug}-${p.styleVariant.suffix}.jpg` });
    } else {
      tiles.push({ key: `classic-${p.id}-base`, passion: p, variantSuffix: "", label: p.label, image: `/badges/classic-${p.fileSlug}.jpg` });
    }
  });
  return tiles.sort((a, b) => a.label.localeCompare(b.label));
}

function groupTilesByCategory(tiles) {
  const groups = {};
  tiles.forEach((tile) => {
    const cat = tile.passion.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(tile);
  });
  return CATEGORY_ORDER.filter((c) => groups[c]).map((c) => ({ category: c, tiles: groups[c] }));
}

// ─── GARMENT MOCKUP PHOTOS — reused from the retail product library ──────────
const PRODUCT_FOLDER = { beanie: "classic-beanie", crew: "classic-crew", hoodie: "classic-ellie", tshirt: "classic-tee", dadhat: "classic-dadhat" };
const RETRO_PRODUCT_FOLDER = { beanie: "retro-beanie", crew: "retro-crew", hoodie: "retro-ellie", tshirt: "retro-tee", dadhat: "retro-dadhat" };

const PHOTO_OVERRIDES_CLASSIC = {
  hoodie: { ice_climbing: "ice-climbing" }, crew: { ice_climbing: "ice-climbing" },
  tshirt: { ice_climbing: "ice-climbing" }, dadhat: { ice_climbing: "ice-climbing" },
  beanie: { ice_climbing: "iceclimbing" },
};
const PHOTO_OVERRIDES_RETRO = {
  hoodie: { ice_climbing: "ice-climbing" }, crew: { ice_climbing: "ice-climbing" },
  tshirt: { ice_climbing: "ice-climbing" }, dadhat: { ice_climbing: "ice-climbing" },
  beanie: { ice_climbing: "ice-climbing" },
};

function getGarmentPhoto(tile, badgeStyle, product, colorId) {
  if (!tile || !product) return null;
  if (product.id === "sticker") return tile.image; // sticker IS the badge design

  const folderMap = badgeStyle === "retro" ? RETRO_PRODUCT_FOLDER : PRODUCT_FOLDER;
  const folder = folderMap[product.id];
  if (!folder) return null; // no real photography yet

  const overrideMap = badgeStyle === "retro" ? PHOTO_OVERRIDES_RETRO : PHOTO_OVERRIDES_CLASSIC;
  const overrides = overrideMap[product.id] || {};
  const slug = overrides[tile.passion.id] || tile.passion.fileSlug;

  const colorSlug = colorId === "grey" ? "gray" : (colorId || "navy");
  const productSlug = product.id === "hoodie" ? "hoodie" : product.id === "tshirt" ? "tee" : product.id;
  const variantSegment = tile.variantSuffix ? `-${tile.variantSuffix}` : "";
  const primarySuffix = product.id === "beanie" ? "flat" : product.id === "dadhat" ? "front" : "ghost";

  return `/products/${folder}/${badgeStyle}-${slug}${variantSegment}-${productSlug}-${colorSlug}-${primarySuffix}.jpg`;
}

// ─── WHOLESALE PRODUCT CATALOG ──────────────────────────────────────────────
const PRODUCTS = [
  { id: "hoodie", label: "The Ellie (Hoodie)", colors: ["navy", "grey", "black"], sizes: ["S", "M", "L", "XL", "2XL"], unitPrice: 54.5 },
  { id: "crew", label: "Crew Sweatshirt", colors: ["navy", "grey", "black"], sizes: ["S", "M", "L", "XL", "2XL"], unitPrice: 39.5 },
  { id: "tshirt", label: "Tee", colors: ["navy", "grey", "black"], sizes: ["S", "M", "L", "XL", "2XL"], unitPrice: 19.5 },
  { id: "beanie", label: "Beanie", colors: ["navy", "grey", "black"], sizes: [], unitPrice: 14.5 },
  { id: "dadhat", label: "Dad Hat", colors: ["navy", "grey", "black"], sizes: [], unitPrice: 14.5 },
  { id: "sticker", label: "Sticker", colors: [], sizes: [], unitPrice: 1.5 },
];

const COLOR_HEX = { navy: "#152238", grey: "#b0b8c1", black: "#1a1a1a" };
const COLOR_LABELS = { navy: "Signature Navy", grey: "Every Gray", black: "Class Black" };
const COLOR_SHORT = { navy: "Navy", grey: "Gray", black: "Black" };

function getAvailableColors(product, badgeStyle) {
  return badgeStyle === "retro" ? ["navy"] : product.colors;
}

const PRODUCT_LINKS = {
  classic: {
    hoodie: "https://www.proudlyaddicted.com/pages/hoodie",
    crew: "https://www.proudlyaddicted.com/pages/crew-sweatshirt-classic",
    tshirt: "https://www.proudlyaddicted.com/pages/tee-shirt",
    beanie: "https://www.proudlyaddicted.com/pages/beanie",
    dadhat: "https://www.proudlyaddicted.com/pages/dad-hat-classic",
  },
  retro: {
    hoodie: "https://www.proudlyaddicted.com/pages/hoodie",
    crew: "https://www.proudlyaddicted.com/pages/crew-sweatshirt-retro",
    tshirt: "https://www.proudlyaddicted.com/pages/tee-shirt",
    beanie: "https://www.proudlyaddicted.com/pages/beanie",
    dadhat: "https://www.proudlyaddicted.com/pages/dad-hat-retro",
  },
};

function MagnifierIcon() {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(21,34,56,0.15)", borderRadius: 8,
    }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <line x1="20" y1="20" x2="15.5" y2="15.5" />
      </svg>
    </div>
  );
}

function badgeCircleStyle() {
  return { width: 70, height: 70, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" };
}

// Groups flat cart line items (one per badge/product/color/size) into cards
// keyed by badge+product+color, so the header shows once and sizes list beneath it.
function groupCartItems(cart) {
  const groups = [];
  cart.forEach((item) => {
    const key = `${item.badge.key}|${item.product.id}|${item.color || "none"}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, badge: item.badge, product: item.product, color: item.color, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });
  return groups;
}

// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthGate({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) onSignedIn(session); }, [session]);

  const requestLink = async () => {
    if (!email) return;
    setStatus("sending");
    const { data, error } = await supabase
      .from("wholesale_accounts")
      .select("email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) { setStatus("denied"); return; }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    setStatus(otpError ? "error" : "sent");
  };

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <img src="/logo full stack 512px.png" alt="Proudly Addicted" style={{ height: 64, width: "auto", objectFit: "contain" }} />
      </div>
      <div style={{ ...styles.content, textAlign: "center", paddingTop: 60 }}>
        <h2 style={styles.stepTitle}>Wholesale Portal</h2>
        <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>Enter your registered email to receive a secure sign-in link.</p>
        <input style={{ ...styles.input, marginBottom: 14 }} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button style={{ ...styles.goldBtn, width: "100%" }} onClick={requestLink} disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Send Sign-In Link"}
        </button>
        {status === "sent" && <p style={{ color: "#27ae60", marginTop: 16, fontSize: 14 }}>Check your email for a sign-in link.</p>}
        {status === "denied" && <p style={{ color: "#c0392b", marginTop: 16, fontSize: 14 }}>That email isn't registered for wholesale access. Contact proudlyaddicted@gmail.com to get set up.</p>}
        {status === "error" && <p style={{ color: "#c0392b", marginTop: 16, fontSize: 14 }}>Something went wrong. Please try again.</p>}
      </div>
    </div>
  );
}

// ─── STEP 0: Multi-select badges ──────────────────────────────────────────────
function StepBadge({
  badgeStyle, setBadgeStyle, badgeView, setBadgeView, selectedBadges, setSelectedBadges,
  activeBadgeKey, setActiveBadgeKey, toggleBadge, recommendedIds, goToConfigure,
}) {
  const tiles = buildBadgeTiles(badgeStyle);
  const sorted = [...tiles].sort((a, b) => {
    const aRec = recommendedIds.includes(a.passion.id) ? 0 : 1;
    const bRec = recommendedIds.includes(b.passion.id) ? 0 : 1;
    return aRec - bRec;
  });
  const hasRecommended = recommendedIds.length > 0;

  return (
    <div>
      <h2 style={styles.stepTitle}>Choose Badges</h2>
      <p style={styles.stepSub}>Tap to select one or more badges for this order.</p>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
        {["classic", "retro"].map((s) => (
          <button
            key={s}
            onClick={() => { setBadgeStyle(s); setSelectedBadges([]); setActiveBadgeKey(null); }}
            style={{
              padding: "8px 24px", borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: "pointer",
              border: badgeStyle === s ? "2px solid #152238" : "1px solid #ddd",
              background: badgeStyle === s ? "#152238" : "transparent",
              color: badgeStyle === s ? "#ffcc00" : "#888",
              textTransform: "capitalize",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
        {[{ id: "grouped", label: "☑ Grouped" }, { id: "grid", label: "▦ Grid" }].map((v) => (
          <button key={v.id} onClick={() => setBadgeView(v.id)} style={{
            padding: "6px 18px", borderRadius: 20, fontWeight: 700, fontSize: 12, cursor: "pointer",
            border: badgeView === v.id ? "2px solid #152238" : "1px solid #ddd",
            background: badgeView === v.id ? "#152238" : "transparent",
            color: badgeView === v.id ? "#ffcc00" : "#888",
          }}>{v.label}</button>
        ))}
      </div>

      {hasRecommended && <p style={{ ...styles.optLabel, marginTop: 4 }}>Recommended For You</p>}
      {badgeView === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {sorted.map((tile) => {
            const isRec = recommendedIds.includes(tile.passion.id);
            const active = !!selectedBadges.find((b) => b.key === tile.key);
            return (
              <div key={tile.key} onClick={() => toggleBadge(tile)} style={{ textAlign: "center", cursor: "pointer", position: "relative" }}>
                <div style={{
                  ...badgeCircleStyle(), margin: "0 auto", overflow: "hidden",
                  boxShadow: active ? "0 0 0 3px #ffcc00" : "0 0 0 1px #eee",
                  transform: active ? "scale(1.05)" : "scale(1)",
                  transition: "transform 0.12s ease",
                }}>
                  <img src={tile.image} alt={tile.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                {active && (
                  <div style={{
                    position: "absolute", top: -2, right: "28%", background: "#ffcc00", color: "#111",
                    borderRadius: "50%", width: 20, height: 20, fontSize: 12, fontWeight: 900,
                    display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff",
                  }}>✓</div>
                )}
                <p style={{ fontSize: 11, color: isRec ? "#152238" : "#888", fontWeight: isRec || active ? 700 : 400, marginTop: 4 }}>{tile.label}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ columnCount: 3, columnGap: 28 }}>
          {groupTilesByCategory(sorted).map(({ category, tiles: catTiles }) => {
            const allSelected = catTiles.every((t) => selectedBadges.find((b) => b.key === t.key));
            const toggleAll = () => {
              setSelectedBadges((prev) => {
                if (allSelected) return prev.filter((b) => !catTiles.find((t) => t.key === b.key));
                const toAdd = catTiles.filter((t) => !prev.find((b) => b.key === t.key));
                return [...prev, ...toAdd];
              });
            };
            return (
              <div key={category} style={{ breakInside: "avoid", marginBottom: 20 }}>
                <div onClick={toggleAll} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8, borderBottom: "1px solid #eee", paddingBottom: 6 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, border: "2px solid #152238",
                    background: allSelected ? "#152238" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#ffcc00", fontSize: 11, fontWeight: 900,
                  }}>{allSelected ? "✓" : ""}</div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#152238", margin: 0 }}>{category}</p>
                  <span style={{ fontSize: 11, color: "#aaa" }}>(select all)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
                  {catTiles.map((tile) => {
                    const active = !!selectedBadges.find((b) => b.key === tile.key);
                    return (
                      <div key={tile.key} onClick={() => toggleBadge(tile)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "6px 0" }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, border: "2px solid #ccc", flexShrink: 0,
                          background: active ? "#ffcc00" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#111", fontSize: 11, fontWeight: 900,
                        }}>{active ? "✓" : ""}</div>
                        <img src={tile.image} alt={tile.label} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                        <p style={{ fontSize: 14, color: active ? "#152238" : "#555", fontWeight: active ? 700 : 400, margin: 0 }}>{tile.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBadges.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={() => { setSelectedBadges([]); setActiveBadgeKey(null); }} style={{ ...styles.ghostBtn, fontSize: 12, padding: "6px 14px" }}>Clear Selected</button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <button disabled={selectedBadges.length === 0} onClick={goToConfigure} style={{ ...styles.goldBtn, opacity: selectedBadges.length ? 1 : 0.4 }}>
          Next: Choose a Product ({selectedBadges.length} badge{selectedBadges.length !== 1 ? "s" : ""}) →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 1: Configure — badge row, product/color picker, quantity matrix ───
function StepConfigure({
  selectedBadges, activeBadge, activeBadgeKey, setActiveBadgeKey, badgeStyle, setStep,
  productView, setProductView, selectedProduct, setSelectedProduct, selectedColor, setSelectedColor,
  quantities, setQuantities, zoomedSrc, setZoomedSrc, addAllToCart, cartCount,
}) {
  const photo = selectedProduct ? getGarmentPhoto(activeBadge, badgeStyle, selectedProduct, selectedColor) : null;
  const sizeColumns = selectedProduct ? (selectedProduct.sizes.length ? selectedProduct.sizes : ["OS"]) : [];

  const setQty = (badgeKey, size, val) => {
    const n = Math.max(0, parseInt(val) || 0);
    setQuantities((prev) => ({ ...prev, [`${badgeKey}|${size}`]: n }));
  };

  const totalUnits = Object.values(quantities).reduce((sum, v) => sum + (parseInt(v) || 0), 0);

  return (
    <div>
      <h2 style={styles.stepTitle}>Configure Order</h2>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", paddingBottom: 8, marginTop: 24, marginBottom: 20, justifyContent: "center" }}>
        {selectedBadges.map((tile) => (
          <div key={tile.key} onClick={() => setActiveBadgeKey(tile.key)} style={{ textAlign: "center", cursor: "pointer", flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", overflow: "hidden",
              boxShadow: activeBadgeKey === tile.key ? "0 0 0 3px #ffcc00" : "0 0 0 1px #ddd",
            }}>
              <img src={tile.image} alt={tile.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <p style={{ fontSize: 11, color: "#888", marginTop: 6, maxWidth: 72 }}>{tile.label}</p>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <button onClick={() => setStep(0)} style={{ ...styles.ghostBtn, fontSize: 12, padding: "6px 14px" }}>← Edit Badges</button>
      </div>

      {!selectedProduct ? (
        <>
          <p style={styles.stepSub}>Choose a product — preview shows {activeBadge?.label}.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
            {[{ id: "grid", label: "▦ Grid" }, { id: "list", label: "☰ List" }].map((v) => (
              <button key={v.id} onClick={() => setProductView(v.id)} style={{
                padding: "6px 18px", borderRadius: 20, fontWeight: 700, fontSize: 12, cursor: "pointer",
                border: productView === v.id ? "2px solid #152238" : "1px solid #ddd",
                background: productView === v.id ? "#152238" : "transparent",
                color: productView === v.id ? "#ffcc00" : "#888",
              }}>{v.label}</button>
            ))}
          </div>

          {productView === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {PRODUCTS.map((p) => {
                const defaultColor = getAvailableColors(p, badgeStyle)[0] || null;
                const preview = getGarmentPhoto(activeBadge, badgeStyle, p, defaultColor);
                return (
                  <div key={p.id} onClick={() => { setSelectedProduct(p); setSelectedColor(defaultColor); }} style={{ border: "1px solid #eee", borderRadius: 12, padding: 10, cursor: "pointer", textAlign: "center" }}>
                    <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, position: "relative" }}>
                      {preview ? (
                        p.id === "sticker" ? (
                          <img src={preview} alt={p.label} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                        ) : (
                          <div onClick={(e) => { e.stopPropagation(); setZoomedSrc(preview); }} style={{ position: "relative", cursor: "zoom-in", height: "100%", display: "flex", alignItems: "center" }}>
                            <img src={preview} alt={p.label} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} onError={(e) => { e.target.parentElement.style.display = "none"; e.target.parentElement.nextSibling.style.display = "flex"; }} />
                            <MagnifierIcon />
                          </div>
                        )
                      ) : null}
                      <div style={{ display: preview ? "none" : "flex", width: 70, height: 70, borderRadius: "50%", background: "#f2f2f2", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 11, textAlign: "center" }}>Available Upon Request</div>
                    </div>
                    <div style={{ display: "inline-block", background: "#152238", borderRadius: 20, padding: "8px 18px" }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#ffcc00", margin: 0 }}>{p.label}</p>
                      <p style={{ fontSize: 12, color: "#cdd4de", margin: "2px 0 0" }}>${p.unitPrice.toFixed(2)}/unit</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PRODUCTS.map((p) => {
                const defaultColor = getAvailableColors(p, badgeStyle)[0] || null;
                const preview = getGarmentPhoto(activeBadge, badgeStyle, p, defaultColor);
                return (
                  <div key={p.id} onClick={() => { setSelectedProduct(p); setSelectedColor(defaultColor); }} style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid #eee", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
                    <div style={{ width: 48, height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {preview ? (
                        <img src={preview} alt={p.label} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                      ) : null}
                      <div style={{ display: preview ? "none" : "flex", width: 40, height: 40, borderRadius: "50%", background: "#f2f2f2", alignItems: "center", justifyContent: "center", color: "#bbb", fontSize: 8, textAlign: "center" }}>Upon Request</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e", margin: 0 }}>{p.label}</p>
                      <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>${p.unitPrice.toFixed(2)}/unit</p>
                    </div>
                    <span style={{ color: "#ccc", fontSize: 18 }}>→</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{selectedProduct.label}</p>
              {PRODUCT_LINKS[badgeStyle]?.[selectedProduct.id] && (
                <a href={PRODUCT_LINKS[badgeStyle][selectedProduct.id]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#152238", textDecoration: "underline" }}>
                  View Product Details →
                </a>
              )}
            </div>
            <button onClick={() => { setSelectedProduct(null); setSelectedColor(null); setQuantities({}); }} style={{ ...styles.ghostBtn, fontSize: 12, padding: "6px 14px" }}>Change Product</button>
          </div>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            {photo && (
              selectedProduct.id === "sticker" ? (
                <img src={photo} alt={selectedProduct.label} style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
              ) : (
                <div onClick={() => setZoomedSrc(photo)} style={{ position: "relative", display: "inline-block", cursor: "zoom-in" }}>
                  <img src={photo} alt={selectedProduct.label} style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display = "none"; }} />
                  <MagnifierIcon />
                </div>
              )
            )}
          </div>

          {getAvailableColors(selectedProduct, badgeStyle).length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <p style={styles.optLabel}>Color</p>
              <div style={{ display: "flex", gap: 16 }}>
                {getAvailableColors(selectedProduct, badgeStyle).map((c) => (
                  <div key={c} onClick={() => { setSelectedColor(c); setQuantities({}); }} style={{ textAlign: "center", cursor: "pointer" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: COLOR_HEX[c] || "#ccc", margin: "0 auto",
                      boxShadow: selectedColor === c ? "0 0 0 3px #ffcc00" : "0 0 0 1px #ddd",
                    }} />
                    <p style={{ fontSize: 11, color: selectedColor === c ? "#152238" : "#888", fontWeight: selectedColor === c ? 700 : 400, marginTop: 4 }}>{COLOR_LABELS[c] || c}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={styles.optLabel}>Quantities by Badge &amp; Size</p>
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={{ borderCollapse: "collapse", width: "auto", minWidth: 260, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid #152238", minWidth: 160 }}>Badge</th>
                  {sizeColumns.map((s) => (
                    <th key={s} style={{ padding: "6px 6px", borderBottom: "2px solid #152238", textAlign: "center" }}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedBadges.map((tile) => (
                  <tr key={tile.key}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee", fontWeight: 600, whiteSpace: "nowrap" }}>{tile.label}</td>
                    {sizeColumns.map((s) => (
                      <td key={s} style={{ padding: "4px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                            autoComplete="off"
                          pattern="[0-9]*"
                          value={quantities[`${tile.key}|${s}`] || ""}
                          onChange={(e) => setQty(tile.key, s, e.target.value.replace(/[^0-9]/g, ""))}
                          style={{ width: 44, padding: "4px 2px", textAlign: "center", border: "1px solid #ddd", borderRadius: 6, fontSize: 12 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ textAlign: "center", color: "#666", fontSize: 13, marginBottom: 16 }}>{totalUnits} unit{totalUnits !== 1 ? "s" : ""} entered</p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setSelectedProduct(null); setSelectedColor(null); setQuantities({}); }} style={styles.ghostBtn}>← Back to Products</button>
            <button disabled={totalUnits === 0} onClick={addAllToCart} style={{ ...styles.goldBtn, opacity: totalUnits ? 1 : 0.4 }}>Add to Quote</button>
            {cartCount > 0 && (
              <button onClick={() => setStep(2)} style={{ ...styles.ghostBtn, borderColor: "#152238", color: "#152238" }}>
                View Quote ({cartCount})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── STEP 2: Cart + Quote request form ───────────────────────────────────────
function StepQuote({ cart, setCart, session, selectedBadges, setSelectedBadges, setActiveBadgeKey, setStep, setIsSubmitted }) {
  const [orderName, setOrderName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (cart.length === 0) return;
    setSending(true);
    setErr("");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterEmail: session.user.email,
          orderName, company, contact, phone, notes,
          cart: cart.map((item) => ({
            badge: item.badge.label,
            badgeStyle: item.badgeStyle,
            product: item.product.label,
            unitPrice: item.product.unitPrice,
            color: item.color,
            size: item.size,
            quantity: Math.max(1, parseInt(item.quantity) || 1),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setIsSubmitted(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 style={styles.stepTitle}>Your Quote Estimate</h2>
      {cart.length === 0 ? (
        <p style={{ color: "#999", textAlign: "center" }}>No items yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          {groupCartItems(cart).map((group) => (
            <div key={group.key} style={{ background: "#f8f8f8", borderRadius: 12, padding: "12px 14px", border: "1px solid #eee" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ ...badgeCircleStyle(), width: 40, height: 40, overflow: "hidden", flexShrink: 0 }}>
                  <img src={group.badge.image} alt="badge" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{group.product.label}</p>
                  <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
                    {group.badge.label}{group.color ? ` · ${COLOR_SHORT[group.color] || group.color}` : ""}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 52 }}>
                {group.items.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid #e8e8e8", paddingTop: 6 }}>
                    {item.size ? (
                      <span style={{ background: "#152238", color: "#ffcc00", borderRadius: 8, padding: "4px 10px", fontSize: 13, fontWeight: 700, width: 44, textAlign: "center" }}>
                        {item.size}
                      </span>
                    ) : (
                      <span style={{ width: 44 }} />
                    )}
                    <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                      <div style={{ background: "#152238", borderRadius: 8, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <span style={{ color: "#ffcc00", fontSize: 12, fontWeight: 700 }}>Qty</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          pattern="[0-9]*"
                          value={item.quantity}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            setCart((prev) => prev.map((c) => (c.id === item.id ? { ...c, quantity: raw } : c)));
                          }}
                          onBlur={() => {
                            setCart((prev) => prev.map((c) => (c.id === item.id ? { ...c, quantity: Math.max(1, parseInt(c.quantity) || 1) } : c)));
                          }}
                          style={{ width: 34, background: "transparent", border: "none", color: "#ffcc00", fontSize: 12, fontWeight: 700, textAlign: "center", outline: "none" }}
                        />
                      </div>
                    </div>
                    <p style={{ width: 60, textAlign: "center", fontSize: 12, color: "#888", margin: 0, flexShrink: 0 }}>
                      ${item.product.unitPrice.toFixed(2)} ea
                    </p>
                    <p style={{ width: 70, textAlign: "right", fontWeight: 700, fontSize: 14, color: "#152238", margin: 0, flexShrink: 0 }}>
                      ${(item.product.unitPrice * (parseInt(item.quantity) || 0)).toFixed(2)}
                    </p>
                    <button onClick={() => setCart((prev) => prev.filter((c) => c.id !== item.id))} style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: 12 }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#152238", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          <span style={{ color: "#cdd4de", fontSize: 14, fontWeight: 600 }}>Estimated Total</span>
          <span style={{ color: "#ffcc00", fontSize: 20, fontWeight: 700 }}>
            ${cart.reduce((sum, item) => sum + item.product.unitPrice * (parseInt(item.quantity) || 0), 0).toFixed(2)}
          </span>
        </div>
      )}

      {cart.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <input style={styles.input} placeholder="Order Name / ID (optional)" value={orderName} onChange={(e) => setOrderName(e.target.value)} />
          <input style={styles.input} placeholder="Company / Shop Name" value={company} onChange={(e) => setCompany(e.target.value)} />
          <input style={styles.input} placeholder="Contact Name" value={contact} onChange={(e) => setContact(e.target.value)} />
          <input style={styles.input} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea style={{ ...styles.input, minHeight: 70 }} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {err && <p style={{ color: "#c0392b", fontSize: 13 }}>{err}</p>}
          <button style={{ ...styles.goldBtn, width: "100%" }} onClick={submit} disabled={sending || !company || !contact}>
            {sending ? "Submitting..." : "Submit Quote Request"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        {selectedBadges.length > 0 && (
          <button onClick={() => setStep(1)} style={styles.ghostBtn}>+ Add More (Same Badges)</button>
        )}
        <button onClick={() => { setSelectedBadges([]); setActiveBadgeKey(null); setStep(0); }} style={styles.ghostBtn}>+ Start New Badge Set</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined);
  const [step, setStep] = useState(0); // 0 badges, 1 configure, 2 quote
  const [badgeStyle, setBadgeStyle] = useState("classic");
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [activeBadgeKey, setActiveBadgeKey] = useState(null);
  const [productView, setProductView] = useState("grid");
  const [badgeView, setBadgeView] = useState("grouped");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState([]);
  const [zoomedSrc, setZoomedSrc] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    const params = new URLSearchParams(window.location.search);
    const rec = params.get("passions");
    if (rec) setRecommendedIds(rec.split(",").map((s) => s.trim().toLowerCase()));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) return <AuthGate onSignedIn={setSession} />;

  const toggleBadge = (tile) => {
    setSelectedBadges((prev) => {
      const exists = prev.find((b) => b.key === tile.key);
      const next = exists ? prev.filter((b) => b.key !== tile.key) : [...prev, tile];
      if (!exists && !activeBadgeKey) setActiveBadgeKey(tile.key);
      if (exists && activeBadgeKey === tile.key) setActiveBadgeKey(next[0]?.key || null);
      return next;
    });
  };

  const activeBadge = selectedBadges.find((b) => b.key === activeBadgeKey) || selectedBadges[0] || null;
  const cartUnitTotal = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

  const goToConfigure = () => {
    setActiveBadgeKey(selectedBadges[0]?.key || null);
    setSelectedProduct(null);
    setSelectedColor(null);
    setQuantities({});
    setStep(1);
  };

  const addAllToCart = () => {
    const newItems = [];
    Object.entries(quantities).forEach(([key, qty]) => {
      const n = parseInt(qty) || 0;
      if (n <= 0) return;
      const [badgeKey, size] = key.split("|");
      const tile = selectedBadges.find((b) => b.key === badgeKey);
      if (!tile) return;
      newItems.push({
        id: `${Date.now()}-${badgeKey}-${size}`,
        badge: tile,
        badgeStyle,
        product: selectedProduct,
        color: selectedColor,
        size: size === "OS" ? null : size,
        quantity: n,
      });
    });
    if (newItems.length === 0) return;
    setCart((prev) => [...prev, ...newItems]);
    setQuantities({});
  };

  if (isSubmitted) return (
    <div style={styles.app}>
      <div style={styles.header}>
        <img src="/logo full stack 512px.png" alt="Proudly Addicted" style={{ height: 64, width: "auto" }} />
      </div>
      <div style={{ ...styles.content, textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ ...styles.stepTitle, fontSize: 28 }}>Quote Request Sent!</h2>
        <p style={{ color: "#666", fontSize: 15 }}>We'll follow up by email with your final quote, terms, and next steps.</p>
        <button onClick={() => { setIsSubmitted(false); setCart([]); setSelectedBadges([]); setActiveBadgeKey(null); setStep(0); }} style={{ ...styles.goldBtn, marginTop: 24 }}>Start a New Request</button>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <img src="/logo full stack 512px.png" alt="Proudly Addicted" style={{ height: 64, width: "auto" }} />
        <button onClick={() => setStep(2)} style={{ position: "absolute", right: 20, background: "none", border: "none", cursor: "pointer", color: "#ffcc00", fontSize: 22 }}>
          📋
          {cart.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ffcc00", color: "#111", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartUnitTotal}</span>}
        </button>
      </div>
      <div style={styles.content}>
        <p style={{ textAlign: "center", color: "#888", fontSize: 14, fontStyle: "italic", marginBottom: 20, marginTop: -8 }}>Wholesale Portal</p>
        {step === 0 && (
          <StepBadge
            badgeStyle={badgeStyle} setBadgeStyle={setBadgeStyle}
            badgeView={badgeView} setBadgeView={setBadgeView}
            selectedBadges={selectedBadges} setSelectedBadges={setSelectedBadges}
            activeBadgeKey={activeBadgeKey} setActiveBadgeKey={setActiveBadgeKey}
            toggleBadge={toggleBadge} recommendedIds={recommendedIds} goToConfigure={goToConfigure}
          />
        )}
        {step === 1 && (
          <StepConfigure
            selectedBadges={selectedBadges} activeBadge={activeBadge} activeBadgeKey={activeBadgeKey} setActiveBadgeKey={setActiveBadgeKey}
            badgeStyle={badgeStyle} setStep={setStep}
            productView={productView} setProductView={setProductView}
            selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
            selectedColor={selectedColor} setSelectedColor={setSelectedColor}
            quantities={quantities} setQuantities={setQuantities}
            zoomedSrc={zoomedSrc} setZoomedSrc={setZoomedSrc} addAllToCart={addAllToCart} cartCount={cartUnitTotal}
          />
        )}
        {step === 2 && (
          <StepQuote
            cart={cart} setCart={setCart} session={session}
            selectedBadges={selectedBadges} setSelectedBadges={setSelectedBadges}
            setActiveBadgeKey={setActiveBadgeKey} setStep={setStep} setIsSubmitted={setIsSubmitted}
          />
        )}
      </div>
      {zoomedSrc && (
        <div
          onClick={() => setZoomedSrc(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, cursor: "zoom-out",
          }}
        >
          <img src={zoomedSrc} alt="Zoomed product" style={{ maxWidth: "90%", maxHeight: "85%", objectFit: "contain" }} />
          <button onClick={() => setZoomedSrc(null)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer" }}>×</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#ffffff", color: "#1a1a2e", fontFamily: "'Trebuchet MS', sans-serif", maxWidth: 960, margin: "0 auto", paddingBottom: 60 },
  header: { display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "12px 20px", borderBottom: "1px solid #0f1a2c", background: "#152238" },
  content: { padding: "16px 32px" },
  stepTitle: { fontFamily: "'Lobster', Georgia, serif", fontSize: 26, fontWeight: 400, color: "#152238", marginBottom: 2, textAlign: "center" },
  stepSub: { color: "#666", fontSize: 13, textAlign: "center", marginBottom: 14 },
  goldBtn: { background: "#ffcc00", color: "#111", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "Georgia, serif" },
  ghostBtn: { background: "transparent", color: "#888", border: "1px solid #ddd", borderRadius: 10, padding: "12px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  optLabel: { color: "#888", fontSize: 13, marginBottom: 10, fontWeight: 600 },
  input: { background: "#f8f8f8", border: "1px solid #ddd", color: "#1a1a2e", borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
};
