# Changelog

## 4.0.0
- Added first-launch nickname setup and `whoami`/`w` identity output.
- Added subtle radio-tower beacon flicker and title glitch effects.
- Collapsed the timeline by default and added era filtering.
- Added a religious-art overview as a separate thematic field, not a visual style.
- Added taxonomy notes distinguishing styles, art forms/media, and applied crafts.
- Added share controls for the site and article pages.
- Added Supabase-backed public comments scaffold and SQL/RLS setup.
- Extracted local storage and share behavior into separate JavaScript files.
- Added museum reference hubs and automated GitHub Actions checks.

## 4.0.1 — Visual direction: Radio Terminal
- Confirmed the radio-terminal visual direction: phosphor-green interface, restrained amber details, dark atmospheric shell.
- Removed the prebuilt tower-light animation so the site owner can create that effect independently.
- Refined the terminal frame, typography, text panels, artwork gallery, taxonomy cards, comments and mobile layout.
- Artwork is displayed with `object-fit: contain` to avoid cropping paintings.
- Moved share actions to quiet footer controls.
- Removed the external source list from the visible interface.
- Added overview pages for art forms/media and decorative-applied arts/crafts.
- Changed `.` to clear only terminal output, leaving the page content intact.
- Limited the random-style command to actual style entries.


## 4.0.2 — Tower lights
- Integrated the 50 independently positioned tower lights supplied in `123.html`.
- Kept the existing `img/BG.jpg` background and terminal layout.
- Added varied asynchronous blink timings for all 50 lights.
- Respects `prefers-reduced-motion`; the lights become static.

### 4.0.3 — Halo Lights & Gallery Pass
- Сделаны полностью прозрачными тела 50 огней; мерцание перенесено на мягкий радиальный ореол.
- Сохранены индивидуальные интервалы мерцания и поддержка `prefers-reduced-motion`.
- Обновлена подача галереи: более просторные изображения, спокойная рамка архива и мягкий hover-акцент без перетягивания внимания с произведений.

## 4.1.0 — Art Direction Skins
- Добавлены индивидуальные цветовые и визуальные акценты для художественных направлений.
- Галерея, карточки и блок описания получают локальную палитру направления, сохраняя общую эстетику Radio Terminal.
- Для кубизма, Баухауса, поп-арта, минимализма, югендстиля и других направлений добавлены сдержанные отличительные детали.
- При переходе к главной странице и обзорам индивидуальная тема сбрасывается.


### 4.1.1 — Art Direction Signals
- Добавлены компактные CSS-заставки перед описанием художественных направлений.
- Шесть визуальных сигнатур: геометрия, световые следы, сновидческая форма, экспрессивная волна, орнамент и архивная разметка.
- Графика создаётся средствами CSS без внешних изображений и не конкурирует с произведениями в галерее.
- Сохранены базовая эстетика Radio Terminal, индивидуальные акценты 4.1.0 и поддержка prefers-reduced-motion.
