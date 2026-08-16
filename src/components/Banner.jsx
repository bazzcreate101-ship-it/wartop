import React, { useEffect, useState } from 'react';
import topupBanner from '../assets/banner/wartop-topup.png';
import digitalBanner from '../assets/banner/wartop-digital.png';
import paymentBanner from '../assets/banner/wartop-payment.png';

const heroSlides = [
  {
    src: topupBanner,
    alt: 'Wartop Digital Hub — top up cepat, main tanpa jeda',
    label: 'Top up cepat',
  },
  {
    src: digitalBanner,
    alt: 'Semua kebutuhan digital kamu lebih dekat bersama Wartop',
    label: 'Kebutuhan digital',
  },
  {
    src: paymentBanner,
    alt: 'Bayar aman dan praktis dengan berbagai metode pembayaran Wartop',
    label: 'Pembayaran lengkap',
  },
];

export default function Banner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % heroSlides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <div className="container-fluid wartop-banner-wrap">
      <section
        className="wartop-banner"
        aria-label="Highlight Wartop"
        aria-roledescription="carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <div className="wartop-banner__viewport">
          {heroSlides.map((slide, index) => (
            <figure
              key={slide.src}
              className={`wartop-banner__slide${index === activeIndex ? ' is-active' : ''}`}
              aria-hidden={index !== activeIndex}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                width="1810"
                height="869"
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                draggable="false"
              />
            </figure>
          ))}
        </div>

        <div className="wartop-banner__pagination" aria-label="Pilih banner">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.label}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={index === activeIndex ? 'is-active' : ''}
              aria-label={`Tampilkan banner ${slide.label}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
