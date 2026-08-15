import React, { useState, useEffect } from 'react';
import { brandWordmark } from '../assets/images';

const heroSlides = [
  {
    eyebrow: 'WARTOP DIGITAL HUB',
    title: 'Top up cepat, main tanpa jeda.',
    description: 'Game, voucher, hiburan, dan saldo digital dalam satu tempat dengan proses yang simpel.',
    chips: ['Proses instan', 'Pembayaran lengkap', 'CS responsif'],
  },
  {
    eyebrow: 'SATU AKUN, BANYAK PILIHAN',
    title: 'Semua kebutuhan digital kamu, lebih dekat.',
    description: 'Temukan produk favorit, pilih nominal, lalu selesaikan transaksi hanya dalam beberapa langkah.',
    chips: ['100+ produk', 'Harga transparan', 'Riwayat tersimpan'],
  },
  {
    eyebrow: 'AMAN DAN PRAKTIS',
    title: 'Bayar dengan cara yang paling nyaman.',
    description: 'QRIS, e-wallet, virtual account, minimarket, dan Saldo Wartop siap dipakai kapan saja.',
    chips: ['QRIS', 'E-wallet', 'Virtual account'],
  },
];

export default function Banner() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container col-md-8 col-12 my-3 wartop-hero-wrap">
      <section className="banner-frame wartop-hero position-relative mx-auto overflow-hidden" aria-label="Highlight Wartop">
        {heroSlides.map((slide, index) => (
          <article
            key={index}
            className={`wartop-hero__slide wartop-hero__slide--${index + 1}`}
            style={{
              opacity: index === activeIndex ? 1 : 0,
              visibility: index === activeIndex ? 'visible' : 'hidden',
              zIndex: index === activeIndex ? 2 : 1,
            }}
            aria-hidden={index !== activeIndex}
          >
            <div className="wartop-hero__glow wartop-hero__glow--one" aria-hidden="true"></div>
            <div className="wartop-hero__glow wartop-hero__glow--two" aria-hidden="true"></div>
            <div className="wartop-hero__grid" aria-hidden="true"></div>

            <div className="wartop-hero__content">
              <span className="wartop-hero__eyebrow">{slide.eyebrow}</span>
              <h2 className="wartop-hero__title">{slide.title}</h2>
              <p className="wartop-hero__description">{slide.description}</p>
              <div className="wartop-hero__chips">
                {slide.chips.map((chip) => <span key={chip}>{chip}</span>)}
              </div>
            </div>

            <div className="wartop-hero__brand" aria-hidden="true">
              <div className="wartop-hero__wordmark-window">
                <img src={brandWordmark} className="wartop-hero__wordmark" alt="" />
              </div>
              <span>Play. Pay. Repeat.</span>
            </div>
          </article>
        ))}

        <div className="wartop-hero__pagination">
          {heroSlides.map((slide, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={index === activeIndex ? 'is-active' : ''}
              aria-label={`Tampilkan: ${slide.title}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
