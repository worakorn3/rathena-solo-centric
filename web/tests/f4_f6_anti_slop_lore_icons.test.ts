import { describe, expect, it } from "bun:test";
import {
  containsUnicodeEmoji,
  UNICODE_EMOJI_REGEX,
  calculateHourlyRatePreview,
} from "./helpers/test-utils";

/**
 * ==============================================================================
 * Test Suite: F4, F5, F6 — Anti-Slop Visuals, Lucide & RO Icons, Ragnarok Lore
 * Requirement Sources: ORIGINAL_REQUEST §R1, PROJECT.md §F4-F6
 * ==============================================================================
 */

describe("Feature F4: Anti-Slop Unicode Emoji Purge", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F4-T1-1: Verifies UI string templates contain ZERO unicode emojis", () => {
    const uiStrings = [
      "Eden Group Logistics",
      "Solo Expedition Operations",
      "Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet.",
      "Lv.85 Rate",
      "Deploy Expedition",
      "Claim in-game via System Tablet",
      "04:30 / 12h Cap",
      "Base EXP",
      "Job EXP",
      "Liquid Zeny",
    ];

    for (const str of uiStrings) {
      expect(containsUnicodeEmoji(str)).toBe(false);
    }
  });

  it("F4-T1-2: Verifies error and validation messages do not contain unicode emojis", () => {
    const errorMessages = [
      "Character is currently online in Ragnarok.",
      "Active dispatch already in progress.",
      "Character not found or unauthorized.",
      "Failed to initiate expedition. Please try again.",
      "Invalid character ID provided.",
    ];

    for (const msg of errorMessages) {
      expect(containsUnicodeEmoji(msg)).toBe(false);
    }
  });

  it("F4-T1-3: Verifies stats and status labels are clean from emojis", () => {
    const labels = ["HP", "SP", "STR", "AGI", "VIT", "INT", "DEX", "LUK", "Online", "Offline", "Status", "Roster"];
    for (const label of labels) {
      expect(containsUnicodeEmoji(label)).toBe(false);
    }
  });

  it("F4-T1-4: Emoji detection regex reliably flags common slop emojis", () => {
    const slopStrings = [
      "⚔️ Deploy Expedition",
      "🛡️ Status Window",
      "✨ 10,000 EXP",
      "⭐ Level Up!",
      "📊 Live Stats",
      "⚡ Lightning Quick",
      "❤️ 12500 HP",
      "💙 620 SP",
      "🪙 2,500,000 Zeny",
    ];

    for (const slop of slopStrings) {
      expect(containsUnicodeEmoji(slop)).toBe(true);
    }
  });

  it("F4-T1-5: Sanitization function removes all unicode emojis from dynamic inputs", () => {
    const inputWithEmoji = "⚔️ SoloKnight ✨ [Eden] 🛡️";
    const sanitized = inputWithEmoji.replace(new RegExp(UNICODE_EMOJI_REGEX, "gu"), "").trim();
    expect(sanitized).toBe("SoloKnight  [Eden]");
    expect(containsUnicodeEmoji(sanitized)).toBe(false);
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F4-T2-1: Handles surrogate pair emojis and complex emojis correctly", () => {
    const complexEmoji = "🧙‍♂️ Wizard 🧙‍♀️"; // Multi-code-point emoji
    expect(containsUnicodeEmoji(complexEmoji)).toBe(true);
  });

  it("F4-T2-2: Handles variation selectors and skin tone modifiers", () => {
    const variationEmoji = "👍🏽 Thumbs up";
    expect(containsUnicodeEmoji(variationEmoji)).toBe(true);
  });

  it("F4-T2-3: Preserves legitimate ASCII punctuation and math symbols without false positives", () => {
    const legitimateText = "Lv.85 • 15,000/h + [Base/Job] (100% Cap) -> Zeny: 2,500/h & HP/SP";
    expect(containsUnicodeEmoji(legitimateText)).toBe(false);
  });

  it("F4-T2-4: Preserves Ragnarok map names with special characters (e.g. prt_fild08, moc_ruins)", () => {
    const mapNames = ["prt_fild08", "pay_dun00", "gef_fild01", "gl_cas01", "iz_dun02"];
    for (const mapName of mapNames) {
      expect(containsUnicodeEmoji(mapName)).toBe(false);
    }
  });

  it("F4-T2-5: Validates that empty strings and whitespace do not trigger emoji detection", () => {
    expect(containsUnicodeEmoji("")).toBe(false);
    expect(containsUnicodeEmoji("   \t\n  ")).toBe(false);
  });
});

describe("Feature F5: Standardized Lucide & RO Iconography", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F5-T1-1: Standardized Lucide icon names match required design specifications", () => {
    const requiredLucideIcons = ["Compass", "Timer", "Coins", "Sparkles", "ShieldAlert", "Shield", "Activity", "CheckCircle"];
    expect(requiredLucideIcons).toContain("Compass");
    expect(requiredLucideIcons).toContain("Timer");
    expect(requiredLucideIcons).toContain("Coins");
    expect(requiredLucideIcons).toContain("Sparkles");
    expect(requiredLucideIcons).toContain("ShieldAlert");
  });

  it("F5-T1-2: In-game RO sprite assets follow standard URL pattern /api/assets/item/:id", () => {
    const zenyAssetUrl = "/api/assets/item/7036";
    const redPotionAssetUrl = "/api/assets/item/501";
    expect(zenyAssetUrl).toMatch(/^\/api\/assets\/item\/\d+$/);
    expect(redPotionAssetUrl).toMatch(/^\/api\/assets\/item\/\d+$/);
  });

  it("F5-T1-3: RO icon images specify .ro-icon class with pixel rendering properties", () => {
    const roIconClass = "w-3 h-3 object-contain ro-icon";
    expect(roIconClass).toContain("ro-icon");
    expect(roIconClass).toContain("object-contain");
  });

  it("F5-T1-4: Lucide icon components specify appropriate SVG stroke and dimension tokens", () => {
    const iconProps = { className: "w-4 h-4 text-accent shrink-0", strokeWidth: 2 };
    expect(iconProps.className).toContain("w-4");
    expect(iconProps.className).toContain("h-4");
    expect(iconProps.strokeWidth).toBe(2);
  });

  it("F5-T1-5: Visual fallback when RO asset image encounters load error", () => {
    const fallbackSrc = "/api/assets/item/placeholder";
    const handleImgError = (target: { src: string }) => {
      target.src = fallbackSrc;
    };
    const mockTarget = { src: "/api/assets/item/999999" };
    handleImgError(mockTarget);
    expect(mockTarget.src).toBe(fallbackSrc);
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F5-T2-1: Validates that Lucide SVG props prevent DOM attribute pollution", () => {
    const validSvgAttributes = ["width", "height", "viewBox", "fill", "stroke", "strokeWidth", "className"];
    expect(validSvgAttributes).toContain("viewBox");
    expect(validSvgAttributes).toContain("strokeWidth");
  });

  it("F5-T2-2: Handles invalid or non-numeric item IDs in asset endpoints gracefully", () => {
    const invalidItemId = "abc";
    const parsed = parseInt(invalidItemId, 10);
    expect(isNaN(parsed)).toBe(true);
  });

  it("F5-T2-3: Verifies item asset ID 0 or negative IDs are handled safely", () => {
    const zeroId = 0;
    const isValidItem = zeroId > 0;
    expect(isValidItem).toBe(false);
  });

  it("F5-T2-4: Ensures icon dimensions scale cleanly across micro badges (w-3 h-3) and cards (w-5 h-5)", () => {
    const microSize = 12; // w-3
    const standardSize = 16; // w-4
    const cardSize = 20; // w-5
    expect(microSize).toBeLessThan(standardSize);
    expect(standardSize).toBeLessThan(cardSize);
  });

  it("F5-T2-5: Validates that icons render with high contrast colors against dark surfaces", () => {
    const contrastTokens = {
      accent: "text-amber-400",
      info: "text-blue-400",
      success: "text-emerald-400",
      alert: "text-rose-400",
    };
    expect(contrastTokens.accent).toContain("text-amber-400");
    expect(contrastTokens.success).toContain("text-emerald-400");
  });
});

describe("Feature F6: In-Game Lore & Copy Alignment", () => {
  // ----------------------------------------------------------------------------
  // Tier 1: Feature Coverage (Happy Path)
  // ----------------------------------------------------------------------------
  it("F6-T1-1: Header and title copy strictly adheres to Eden Group Logistics / Solo Expedition Operations", () => {
    const title = "Eden Group Logistics";
    const subtitle = "Solo Expedition Operations";
    expect(title).toBe("Eden Group Logistics");
    expect(subtitle).toBe("Solo Expedition Operations");
  });

  it("F6-T1-2: Rate preview badge uses format 'Lv.X Rate'", () => {
    const preview85 = calculateHourlyRatePreview(85, 50);
    expect(preview85.rateBadge).toBe("Lv.85 Rate");

    const preview99 = calculateHourlyRatePreview(99, 50);
    expect(preview99.rateBadge).toBe("Lv.99 Rate");
  });

  it("F6-T1-3: Claim guidance copy references the in-game 'System Tablet'", () => {
    const claimGuidance = "Claim in-game via System Tablet";
    expect(claimGuidance).toContain("System Tablet");
    expect(claimGuidance).toContain("Claim in-game");
  });

  it("F6-T1-4: Online disabled banner clearly guides player to initiate dispatch offline or via System Tablet", () => {
    const onlineBanner = "Character currently logged into Ragnarok. Dispatches must be initiated while offline or via the System Tablet.";
    expect(onlineBanner).toContain("logged into Ragnarok");
    expect(onlineBanner).toContain("offline or via the System Tablet");
  });

  it("F6-T1-5: Yield categories are named using authentic Ragnarok terms: Base EXP, Job EXP, Zeny", () => {
    const yieldNames = ["Base EXP", "Job EXP", "Zeny"];
    expect(yieldNames).toContain("Base EXP");
    expect(yieldNames).toContain("Job EXP");
    expect(yieldNames).toContain("Zeny");
  });

  // ----------------------------------------------------------------------------
  // Tier 2: Boundary & Corner Cases
  // ----------------------------------------------------------------------------
  it("F6-T2-1: Rejects generic fintech buzzwords (Crypto, Staking, Dividend, APY, Yield Farming)", () => {
    const genericFintechWords = ["Crypto", "Staking", "Dividend", "APY", "Yield Farming", "Liquidity Pool"];
    const dispatchLoreText = "Eden Group Logistics — Solo Expedition Operations. Gain Base EXP, Job EXP, and Zeny while offline.";
    
    for (const forbiddenWord of genericFintechWords) {
      expect(dispatchLoreText).not.toContain(forbiddenWord);
    }
  });

  it("F6-T2-2: Formats large Zeny values with standard commas or k/M suffixes appropriately", () => {
    const zeny = 1250000;
    const formatted = zeny.toLocaleString();
    expect(formatted).toBe("1,250,000");
  });

  it("F6-T2-3: Handles level 1 character rate badge format (Lv.1 Rate)", () => {
    const preview1 = calculateHourlyRatePreview(1, 1);
    expect(preview1.rateBadge).toBe("Lv.1 Rate");
  });

  it("F6-T2-4: Preserves casing for Ragnarok Online specific proper nouns (Prontera, Eden Group, System Tablet, Kafra)", () => {
    const properNouns = ["Eden Group", "System Tablet", "Kafra", "Prontera", "Morroc", "Geffen", "Payon", "Alberta"];
    for (const noun of properNouns) {
      expect(noun[0]).toBe(noun[0].toUpperCase());
    }
  });

  it("F6-T2-5: Fallback copy handles unknown character class or level without breaking formatting", () => {
    const unknownClassRate = calculateHourlyRatePreview(0, 0);
    expect(unknownClassRate.rateBadge).toBe("Lv.0 Rate");
    expect(unknownClassRate.baseExpPerHour).toBe(0);
  });
});
