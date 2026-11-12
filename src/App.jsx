import React, { useEffect, useRef, useState } from 'react';
import works from './works.js';
import CrtScreen from './CrtScreen.jsx';
import MonitorFrame from './MonitorFrame.jsx';
import ScreenReflections from './ScreenReflections.jsx';
import logo from './assets/optimized/Logo.webp';
import note from './assets/optimized/note.webp';
import noteShadow from './assets/optimized/noteshadow.webp';
import portrait from './assets/optimized/portrait.webp';
import monitorButton from './assets/optimized/button.webp';
import stickerCar from './assets/optimized/sticker-1.webp';
import stickerGoku from './assets/optimized/sticker-2.webp';
import stickerTape from './assets/optimized/sticker-3.webp';
import MonochromeArtwork from './MonochromeArtwork.jsx';
import Artwork from './RotatingArtwork.jsx';

function Viewer({ index, initialSlide = 0, onClose }) {
  const dialog = useRef(null);
  const touchStart = useRef(null);
  const work = works[index];
  const [slideIndex, setSlideIndex] = useState(initialSlide);
  const slide = work.slides[slideIndex];
  const thumbnailStrip = useRef(null);
  function onNavigate(step) {
    setSlideIndex(value => (value + step + work.slides.length) % work.slides.length);
  }

  useEffect(() => {
    const nextSlide = work.slides[(slideIndex + 1) % work.slides.length];
    if (nextSlide.type !== 'video') {
      const next = new Image();
      next.src = nextSlide.src;
    }
    thumbnailStrip.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [slideIndex, work]);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);

  return (
    <dialog className="category-viewer" ref={dialog} aria-label={`Galeria: ${work.title}`} onCancel={onClose}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }}
      onKeyDown={event => {
        if (event.target.closest('video')) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          onNavigate(event.key === 'ArrowRight' ? 1 : -1);
        }
      }}
      onTouchStart={event => { touchStart.current = event.target.closest('video, .viewer-thumbnails') ? null : event.changedTouches[0].clientX; }}
      onTouchEnd={event => {
        if (touchStart.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(distance) > 65) onNavigate(distance < 0 ? 1 : -1);
        touchStart.current = null;
      }}>
      <div className="viewer-toolbar"><span>{work.title}</span><button onClick={onClose} aria-label="Zamknij podgląd">CLOSE [ESC] ×</button></div>
      <div className={`viewer-stage ${work.slides.length === 1 ? 'single-item' : ''}`}>
        {work.slides.length > 1 && <button onClick={() => onNavigate(-1)} aria-label="Poprzednia grafika">←</button>}
        {slide.type === 'video' ? <video key={slide.src} src={slide.src} controls playsInline preload="metadata" aria-label={slide.title} />
          : work.monochrome ? <MonochromeArtwork src={slide.src} title={slide.title} width={slide.width} height={slide.height} />
          : <img key={slide.src} src={slide.src} alt={slide.title} width={slide.width} height={slide.height} />}
        {work.slides.length > 1 && <button onClick={() => onNavigate(1)} aria-label="Następna grafika">→</button>}
      </div>
      <div className="viewer-bottom" aria-live="polite"><span>{slide.title}</span><span>{String(slideIndex + 1).padStart(2, '0')} / {work.slides.length}</span></div>
      {work.slides.length > 1 && <div className="viewer-thumbnails" ref={thumbnailStrip} aria-label="Wybierz grafikę">
        {work.slides.map((item, i) => <button key={item.key} aria-label={`Pokaż: ${item.title}${i === 0 ? ' (okładka)' : ''}`} aria-current={i === slideIndex ? 'true' : undefined} onClick={() => setSlideIndex(i)}>
          {item.type === 'video' ? <span className="video-thumbnail" aria-hidden="true">▶<small>{String(i + 1).padStart(2, '0')}</small></span>
            : work.monochrome ? <MonochromeArtwork src={i === 0 ? work.src : item.src} title="" width={item.width} height={item.height} />
            : <img src={i === 0 ? work.src : item.src} alt="" loading="lazy" />}
        </button>)}
      </div>}
    </dialog>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('works');
  const [density, setDensity] = useState('compact');
  const [selected, setSelected] = useState(null);
  const [rotateCovers, setRotateCovers] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [desktopVideo, setDesktopVideo] = useState(() => matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)').matches);
  const screen = useRef(null);
  const lastWorkButton = useRef(null);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const desktop = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    const update = () => setDesktopVideo(desktop.matches);
    desktop.addEventListener('change', update);
    return () => desktop.removeEventListener('change', update);
  }, []);

  function backToTop(event) {
    event.preventDefault();
    screen.current.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function openWork(index, slideIndex = 0) {
    lastWorkButton.current = document.activeElement;
    setSelected({ index, slideIndex });
  }

  function closeWork() {
    setSelected(null);
    lastWorkButton.current?.focus();
  }

  return (
    <>
      <div className="computer computer-image-frame">
        <MonitorFrame />
        <ScreenReflections />
        <div className="bezel"><CrtScreen enabled><div className="screen" id="screen" ref={screen}>
          <header>
            <a className="wordmark" href="#screen" aria-label="Strona główna" onClick={backToTop}>Marcin Jarka<span className="star">✳</span></a>
            <span className="header-label">INDEPENDENT GRAPHIC ARCHIVE</span>
          </header>
          <nav className="portfolio-tabs" role="tablist" aria-label="Portfolio" onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 'works' : event.key === 'End' ? 'about' : activeTab === 'works' ? 'about' : 'works';
            setActiveTab(next);
            event.currentTarget.querySelector(`#tab-${next}`).focus();
          }}>
            <button id="tab-works" role="tab" aria-selected={activeTab === 'works'} aria-controls="panel-works" tabIndex={activeTab === 'works' ? 0 : -1} onClick={() => setActiveTab('works')}>Prace</button>
            <button id="tab-about" role="tab" aria-selected={activeTab === 'about'} aria-controls="panel-about" tabIndex={activeTab === 'about' ? 0 : -1} onClick={() => setActiveTab('about')}>O mnie</button>
          </nav>
          <main>
            <div id="panel-works" role="tabpanel" aria-labelledby="tab-works" hidden={activeTab !== 'works'}>
            <section className="intro">
              <div className="eyebrow"><span className="led" /> SYSTEM ONLINE <span className="muted">/ PORTFOLIO V.01</span></div>
              <h1>Obrazy z innej<br />częstotliwości<span className="cursor">_</span></h1>
            </section>
            <section className="works" aria-labelledby="worksTitle">
              <div className="section-bar">
                <h2 id="worksTitle">[01] SELECTED WORKS</h2><span>{String(works.length).padStart(2, '0')} ENTRIES</span>
                <button className="rotation-toggle" aria-label="Automatyczna zmiana okładek" aria-pressed={rotateCovers} onClick={() => setRotateCovers(value => !value)} title={reducedMotion ? 'Włącz lub zatrzymaj zmianę zdjęć. Ograniczony ruch wyłącza tylko przenikanie.' : 'Włącz lub zatrzymaj zmianę okładek'}>AUTO {rotateCovers ? 'Ⅱ' : '▶'}</button>
                <div className="view-controls" aria-label="Gęstość galerii">
                  <button className={density === 'comfortable' ? 'active' : ''} aria-pressed={density === 'comfortable'} onClick={() => setDensity('comfortable')} aria-label="Większe miniatury">▦</button>
                  <button className={density === 'compact' ? 'active' : ''} aria-pressed={density === 'compact'} onClick={() => setDensity('compact')} aria-label="Mniejsze miniatury">▦▦</button>
                </div>
              </div>
              <div className={`gallery category-gallery ${density === 'comfortable' ? 'comfortable' : ''}`}>
                {works.map((work, index) => <Artwork key={work.id} work={work} index={index} onOpen={openWork} rotating={rotateCovers && selected === null && activeTab === 'works'} autoplayVideos={desktopVideo} />)}
              </div>
            </section>
            </div>
            <section id="panel-about" className="about-panel" role="tabpanel" aria-labelledby="tab-about" hidden={activeTab !== 'about'}>
              <div className="about-layout">
              <div className="about-copy">
              <div className="eyebrow"><span className="led" /> ABOUT / MARCIN JARKA</div>
              <h1>Marcin Jarka<span className="cursor">_</span></h1>
              <p>Działam na styku designu, technologii i eksperymentu.</p>
              <p>Nie interesują mnie sztywne podziały na 2D, 3D, AI czy motion. Traktuję je jako elementy jednego, nieustannie zmieniającego się języka wizualnego.</p>
              <p>Łączę techniki, testuję nowe narzędzia i szukam rozwiązań poza utartymi schematami. Lubię moment, w którym różne światy zaczynają się przenikać, tworząc coś zupełnie nowego.</p>
              <p>Moja praca to ciągłe poszukiwanie nowych form, estetyk i sposobów opowiadania obrazem.</p>
              <div className="about-contact"><a href="mailto:marcinjarka@gmail.com">marcinjarka@gmail.com ↗</a><a href="tel:+48508963647">508 – 963 – 647 ↗</a></div>
              </div>
              <figure className="about-photo">
                {activeTab === 'about' && <img src={portrait} alt="Pikselowy portret Marcina Jarki" width="848" height="1264" className="about-portrait" decoding="async" />}
              </figure>
              </div>
            </section>
            <footer><span>END OF TRANSMISSION <span className="blink">■</span></span><a href="#screen" onClick={backToTop}>BACK TO TOP ↑</a><span>© {new Date().getFullYear()} FOLIO</span></footer>
          </main>
        </div></CrtScreen></div>
        <img className="monitor-logo" src={logo} alt="Jarka" width="492" height="142" draggable="false" />
        <img className="monitor-power-image" src={monitorButton} alt="Przycisk zasilania z zieloną diodą" width="158" height="77" draggable="false" />
        <div className="monitor-stickers" aria-hidden="true">
          <img className="monitor-sticker sticker-car" src={stickerCar} alt="" width="456" height="268" draggable="false" />
          <img className="monitor-sticker sticker-goku" src={stickerGoku} alt="" width="319" height="482" draggable="false" />
          <img className="monitor-sticker sticker-tape" src={stickerTape} alt="" width="430" height="342" draggable="false" />
        </div>
        <img className="contact-note contact-note-shadow" src={noteShadow} alt="" width="670" height="697" draggable="false" />
        <aside className="contact-note contact-note-front" aria-label="Kontakt">
          <img className="contact-note-paper" src={note} alt="" width="670" height="697" draggable="false" />
          <div className="contact-note-copy">
            <h2>Kontakt</h2>
            <a href="mailto:marcinjarka@gmail.com">marcinjarka@gmail.com</a>
            <a href="tel:+48508963647">508 – 963 – 647</a>
          </div>
        </aside>
      </div>
      {selected !== null && <Viewer key={works[selected.index].id} index={selected.index} initialSlide={selected.slideIndex} onClose={closeWork} />}
    </>
  );
}
