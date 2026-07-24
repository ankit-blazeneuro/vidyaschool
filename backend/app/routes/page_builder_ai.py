import os
import json
import uuid
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter()

class PageBuilderAIRequest(BaseModel):
    prompt: str
    blocks: List[Dict[str, Any]] = []
    viewport: Optional[str] = "desktop"
    viewMode: Optional[str] = "blueprint"
    model: Optional[str] = "meta/llama-3.1-8b-instruct"

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"

SYSTEM_PROMPT = """You are VidyaSchool's Lead UI/UX AI Architect & Chief Design Officer, trained on top-tier design systems from Apple, Vercel, Stripe, and Linear.

Your job is to process user design prompts and generate or update page layouts composed of component blocks that look stunning, professional, modern, and high-converting.

CRITICAL TEXT COPY RULE:
- NEVER set heading or paragraph text to raw command instructions like "hey in my page add a pdf viewer" or "with optimum components".
- Always write realistic, high-converting, professional school platform copy (e.g. "VidyaSchool Academic Performance & STEM Curriculum 2026", "Comprehensive board exam results and academic syllabus tracking").

BIG TECH DESIGN BLUEPRINTS & HIERARCHY RULES:
1. PRESERVE EXISTING ELEMENTS:
   - If existing blocks are provided (especially when prompt says "with these elements create a nice page", "arrange these", "design this page", etc.), NEVER remove or delete existing blocks unless explicitly told to remove something.
   - Maintain the exact original `id` for every block so frontend state remains synced.

2. PROFESSIONAL LANDING PAGE & DASHBOARD LAYOUT SEQUENCING:
   - HERO ANNOUNCEMENT BADGE: `badge` block at the top (`align: "center"`, `isInline: false`).
   - HERO DISPLAY HEADING: `heading` block with `level: "h1"`, `align: "center"`, bold copy (`isInline: false`).
   - HERO SUBTITLE PARAGRAPH: `paragraph` block (`align: "center"`, max-width centered, clear readable text).
   - HERO ACTION BUTTONS: 2 side-by-side `button` blocks (`variant: "default"` + `variant: "outline"`, `isInline: true`, `customWidth: 170`).
   - BENTO GRID & METRICS SECTION:
     - `stats` KPI cards (`isInline: true`, `customWidth: 240`) showing impressive metrics (e.g. "98.5% Pass Rate", "10,000+ Students", "100% Accredited").
     - `card` feature cards (`isInline: true`, `customWidth: 320`) detailing academic excellence, syllabus tracking, or STEM programs.
   - MEDIA & DOCUMENT SHOWCASE:
     - Integrated `pdf` viewer (`title`: "VidyaSchool Academic Performance & Curriculum Guide.pdf", `customHeight: 380`, `isInline: false`).
     - `video` or `image` with rounded corners.
   - TRUST & SOCIAL PROOF:
     - `quote` testimonial or `alert` announcement bar (`variant: "info"` or `"success"`).

3. SPACING, ALIGNMENT & SIZING:
   - For side-by-side components in a row (e.g. Buttons, Badges, Avatars, Stats boxes, Cards), set `isInline: true`.
   - Assign responsive `customWidth` (200px to 450px) and `customHeight` where applicable.

4. AVAILABLE BLOCK TYPES:
   - heading: props { text, level: "h1"|"h2"|"h3", align: "left"|"center"|"right" }
   - paragraph: props { text, align: "left"|"center"|"right" }
   - button: props { label, variant: "default"|"outline"|"ghost", align: "left"|"center"|"right" }
   - badge: props { label, variant: "default"|"secondary"|"outline" }
   - input: props { label, placeholder }
   - avatar: props { name, role }
   - progress: props { label, value }
   - stats: props { value, label, change }
   - pdf: props { title, url }
   - image: props { src, alt, rounded }
   - video: props { url, rounded }
   - columns: props { left, right, gap }
   - divider: props { spacing: "sm"|"md"|"lg" }
   - spacer: props { height: "40" }
   - list: props { items }
   - quote: props { text, author }
   - alert: props { text, variant: "info"|"success"|"warning" }
   - card: props { title, body }

JSON OUTPUT FORMAT:
You MUST respond with valid JSON ONLY in this exact structure:
{
  "explanation": "Clear short summary of Big Tech design enhancements applied.",
  "blocks": [
    {
      "id": "block-id",
      "type": "heading",
      "props": { ... },
      "x": 0,
      "y": 0,
      "customWidth": 320,
      "customHeight": 120,
      "isInline": true,
      "isFreeform": false,
      "horizontalBias": 50,
      "verticalBias": 50,
      "anchoredLeft": true,
      "anchoredRight": true
    }
  ]
}
"""

def clean_heading_from_prompt(prompt: str) -> str:
    """Generates authentic academic titles instead of repeating user instructions."""
    p = prompt.strip()
    p_lower = p.lower()
    
    instruction_keywords = [
        "add", "create", "make", "design", "build", "put", "in my page", "page with",
        "optimum", "components", "nice", "best", "hey", "please", "with pdf", "viewer"
    ]
    
    if any(k in p_lower for k in instruction_keywords):
        if "academic" in p_lower or "performance" in p_lower or "school" in p_lower:
            return "VidyaSchool Academic Performance & STEM Curriculum 2026"
        elif "syllabus" in p_lower or "pdf" in p_lower:
            return "Academic Syllabus & Course Curriculum Guide"
        elif "admission" in p_lower or "student" in p_lower:
            return "VidyaSchool Excellence & Student Portal 2026"
        else:
            return "VidyaSchool Next-Gen Education Platform"
            
    return p.title() if (len(p) > 0 and len(p) < 60) else "VidyaSchool Academic Performance & STEM Curriculum 2026"

def fallback_ai_layout_engine(prompt: str, existing_blocks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Big-Tech intelligent layout engine that rearranges existing blocks and adds complementary blocks."""
    updated_blocks = []
    
    # Work on existing blocks first - NEVER remove them!
    if existing_blocks:
        # Separate blocks into Big Tech section groups for professional visual flow
        badges = [b for b in existing_blocks if b.get("type") == "badge"]
        headings = [b for b in existing_blocks if b.get("type") == "heading"]
        paragraphs = [b for b in existing_blocks if b.get("type") == "paragraph"]
        buttons = [b for b in existing_blocks if b.get("type") == "button"]
        bento_items = [b for b in existing_blocks if b.get("type") in ["stats", "card", "avatar", "progress", "input"]]
        media_items = [b for b in existing_blocks if b.get("type") in ["pdf", "image", "video", "columns"]]
        others = [b for b in existing_blocks if b not in badges + headings + paragraphs + buttons + bento_items + media_items]

        ordered = badges + headings + paragraphs + buttons + bento_items + media_items + others

        for i, b in enumerate(ordered):
            b_copy = dict(b)
            b_type = b_copy.get("type", "heading")
            props = dict(b_copy.get("props", {}))
            
            # Clean heading text if it contains user prompt instructions
            if b_type == "heading":
                txt = props.get("text", "")
                if any(kw in txt.lower() for kw in ["hey in my page", "add a nice pdf", "optimum components", "put optimum text"]):
                    props["text"] = "VidyaSchool Academic Performance & STEM Curriculum 2026"
            
            # Preserve exact original ID
            b_copy["id"] = b_copy.get("id") or str(uuid.uuid4())
            
            b_copy["horizontalBias"] = b_copy.get("horizontalBias", 50)
            b_copy["verticalBias"] = b_copy.get("verticalBias", 50)
            b_copy["anchoredLeft"] = True
            b_copy["anchoredRight"] = True
            
            # Apply Apple/Vercel Big Tech layout rules per component type
            if b_type == "badge":
                props["align"] = "center"
                b_copy["isInline"] = False
                b_copy["isFreeform"] = False
            elif b_type == "heading":
                if i == len(badges):
                    props["align"] = "center"
                    props["level"] = "h1"
                else:
                    props["align"] = props.get("align", "left")
                b_copy["isInline"] = False
                b_copy["isFreeform"] = False
            elif b_type == "paragraph":
                props["align"] = "center"
                b_copy["isInline"] = False
                b_copy["isFreeform"] = False
            elif b_type == "button":
                props["align"] = "center"
                b_copy["isInline"] = True
                b_copy["isFreeform"] = False
                if not b_copy.get("customWidth"):
                    b_copy["customWidth"] = 170
            elif b_type == "stats":
                b_copy["isInline"] = True
                b_copy["isFreeform"] = False
                b_copy["customWidth"] = b_copy.get("customWidth") or 240
            elif b_type == "card":
                b_copy["isInline"] = True
                b_copy["isFreeform"] = False
                b_copy["customWidth"] = b_copy.get("customWidth") or 320
            elif b_type == "pdf":
                b_copy["isInline"] = False
                b_copy["isFreeform"] = False
                b_copy["customHeight"] = b_copy.get("customHeight") or 380
            elif b_type == "image":
                b_copy["isInline"] = False
                b_copy["isFreeform"] = False
                b_copy["customHeight"] = b_copy.get("customHeight") or 280
            else:
                b_copy["isInline"] = b_copy.get("isInline", True)
                b_copy["isFreeform"] = False
                    
            b_copy["props"] = props
            updated_blocks.append(b_copy)
            
        explanation = f"Preserved all {len(existing_blocks)} existing elements and reformatted them into a Vercel/Stripe-style Big Tech hero & bento grid section."
    else:
        heading_title = clean_heading_from_prompt(prompt)
        # Generate full initial Apple/Vercel level Hero & Bento grid section
        updated_blocks = [
            {
                "id": str(uuid.uuid4()),
                "type": "badge",
                "props": {"label": "ACADEMIC EXCELLENCE REPORT 2026", "variant": "default"},
                "isInline": False,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "heading",
                "props": {"text": heading_title, "level": "h1", "align": "center"},
                "isInline": False,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "paragraph",
                "props": {"text": "Empowering students and educators with integrated digital learning, board exam performance reports, live syllabus tracking, and AI tutoring.", "align": "center"},
                "isInline": False,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "button",
                "props": {"label": "View Performance PDF", "variant": "default", "align": "center"},
                "isInline": True,
                "customWidth": 180,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "button",
                "props": {"label": "Download Syllabus", "variant": "outline", "align": "center"},
                "isInline": True,
                "customWidth": 170,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "stats",
                "props": {"value": "98.5%", "label": "Board Examination Pass Rate", "change": "+3.4% vs last session"},
                "isInline": True,
                "customWidth": 240,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "stats",
                "props": {"value": "100%", "label": "STEM & Robotics Accreditation", "change": "Certified Grade A"},
                "isInline": True,
                "customWidth": 240,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "stats",
                "props": {"value": "10,000+", "label": "Active Enrolled Scholars", "change": "Verified Active"},
                "isInline": True,
                "customWidth": 240,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "pdf",
                "props": {"title": "VidyaSchool_Academic_Performance_Report_2026.pdf", "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"},
                "isInline": False,
                "customHeight": 380,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "card",
                "props": {"title": "STEM & AI Robotics Curriculum", "body": "State-of-the-art laboratory access, interactive coding courses, and AI-assisted tutoring."},
                "isInline": True,
                "customWidth": 320,
                "isFreeform": False
            },
            {
                "id": str(uuid.uuid4()),
                "type": "card",
                "props": {"title": "Holistic Development & Sports", "body": "Olympic-standard sports facilities, arts, music, and leadership development programs."},
                "isInline": True,
                "customWidth": 320,
                "isFreeform": False
            }
        ]
        explanation = f"Generated a complete academic performance landing section with hero, CTAs, Bento Grid stats, and PDF document viewer."

    # If user prompt specifically asks to add PDF or Stats or Cards and they don't exist yet, append them
    prompt_lower = prompt.lower()
    if "pdf" in prompt_lower and not any(b.get("type") == "pdf" for b in updated_blocks):
        updated_blocks.append({
            "id": str(uuid.uuid4()),
            "type": "pdf",
            "props": {"title": "Document & Curriculum Guide.pdf", "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"},
            "isInline": False,
            "customHeight": 340,
            "isFreeform": False
        })
        explanation += " Added PDF document viewer widget."

    if "stat" in prompt_lower and not any(b.get("type") == "stats" for b in updated_blocks):
        updated_blocks.append({
            "id": str(uuid.uuid4()),
            "type": "stats",
            "props": {"value": "100%", "label": "Verified Success", "change": "+5% growth"},
            "isInline": True,
            "customWidth": 240,
            "isFreeform": False
        })
        explanation += " Added KPI stats counter card."

    return {
        "explanation": explanation,
        "blocks": updated_blocks
    }

@router.post("/ai")
@router.post("/api/page-builder/ai")
async def generate_page_builder_ai(req: PageBuilderAIRequest):
    """API endpoint for Page Builder AI Agent to arrange/design page elements."""
    prompt = req.prompt
    existing_blocks = req.blocks or []
    
    api_key = NVIDIA_API_KEY or OPENAI_API_KEY
    
    if api_key:
        try:
            user_payload = {
                "prompt": prompt,
                "existing_blocks": existing_blocks,
                "instruction": "Please refine, arrange, and style these existing blocks according to the prompt while preserving all existing elements and their IDs."
            }
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            target_model = req.model or ("meta/llama-3.1-8b-instruct" if NVIDIA_API_KEY else "gpt-3.5-turbo")
            payload = {
                "model": target_model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": json.dumps(user_payload)}
                ],
                "temperature": 0.3,
                "max_tokens": 1500
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(NVIDIA_BASE_URL if NVIDIA_API_KEY else "https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    
                    # Extract JSON block
                    clean_json = content
                    if "```json" in content:
                        clean_json = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        clean_json = content.split("```")[1].split("```")[0].strip()
                        
                    parsed = json.loads(clean_json)
                    if "blocks" in parsed and isinstance(parsed["blocks"], list):
                        return parsed
        except Exception as e:
            print(f"[PageBuilderAI] LLM Call exception: {e}, falling back to local layout engine.")
            
    # Fallback to local intelligent layout engine
    return fallback_ai_layout_engine(prompt, existing_blocks)

