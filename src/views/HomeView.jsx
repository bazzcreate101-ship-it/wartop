import React, { useState } from 'react';
import Banner from '../components/Banner';
import FlashSale from '../components/FlashSale';
import Categories from '../components/Categories';
import { brandMark, productImages } from '../assets/images';
import { categories as productCategories } from '../data/products';

export default function HomeView({ products, onSelectProduct, onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('popular');

  const visibleProducts = products.filter((product) => product.active !== false);
  const filteredProducts = activeCategory === 'popular'
    ? visibleProducts.filter(p => p.popular)
    : visibleProducts.filter(p => p.category === activeCategory);
  const activeCategoryName = productCategories.find((category) => category.id === activeCategory)?.name || 'Produk';

  const handleProductClick = (prodId, e) => {
    e.preventDefault();
    onSelectProduct(prodId);
  };

  return (
    <div className="main main-surface">

      {/* 1. HERO BANNER SLIDER */}
      <Banner />

      <div className="container col-md-8 col-12">
        <section className="wartop-storefront" aria-labelledby="storefront-title">
          <header className="wartop-storefront__intro">
            <div>
              <span className="section-eyebrow">Wartop Marketplace</span>
              <h2 id="storefront-title">Pilih layanan digitalmu.</h2>
              <p>Game, hiburan, pembayaran, dan platform AI kini ditata per brand agar lebih mudah ditemukan.</p>
            </div>
            <div className="wartop-storefront__signals" aria-label="Keunggulan Wartop">
              <span><i className="bi bi-lightning-charge-fill" aria-hidden="true"></i> Proses cepat</span>
              <span><i className="bi bi-shield-check" aria-hidden="true"></i> Checkout aman</span>
              <span><i className="bi bi-headset" aria-hidden="true"></i> Bantuan aktif</span>
            </div>
          </header>

          <Categories activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

          <section className="wartop-catalog" id="allContent" aria-live="polite">
            <header className="wartop-catalog__header">
              <div>
                <span className="wartop-catalog__eyebrow">Koleksi aktif</span>
                <h3>{activeCategoryName}</h3>
              </div>
              <span className="wartop-catalog__count">{filteredProducts.length} produk</span>
            </header>

            <div className="wartop-catalog__grid" id="populer-grid-max">
              {filteredProducts.map((product) => (
                <a
                  key={product.id}
                  href={`/order/${product.id}`}
                  onClick={(event) => handleProductClick(product.id, event)}
                  className={`wartop-product-card ${product.category === '9' ? 'wartop-product-card--ai' : ''}`}
                  aria-label={`Lihat ${product.name}`}
                >
                  <div className="wartop-product-card__media" style={{ backgroundImage: `url('${product.image}')` }}>
                    <span className="wartop-product-card__veil" aria-hidden="true"></span>
                    <img
                      src={product.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(event) => { event.currentTarget.src = '/wartop-mark.png'; }}
                    />
                    {product.discount && <span className="wartop-product-card__badge">{product.discount}</span>}
                    <span className="wartop-product-card__arrow" aria-hidden="true"><i className="bi bi-arrow-up-right"></i></span>
                  </div>
                  <div className="wartop-product-card__body">
                    <span>{product.cardLabel || 'Top up digital'}</span>
                    <h4>{product.name}</h4>
                    <small>{product.category === '9' ? `${product.denominations?.length || 0} varian tersedia` : 'Lihat nominal & harga'}</small>
                  </div>
                </a>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="wartop-catalog__empty">
                <i className="bi bi-search" aria-hidden="true"></i>
                <span>Belum ada produk aktif pada kategori ini.</span>
              </div>
            )}
          </section>
        </section>

        {/* 3. NEWS SECTION */}
        <div className="news-section mb-4" style={{ background: 'transparent', padding: 0 }}>
          <div className="news-section-header">
            <div className="news-section-title">
              <span>Berita</span>
              <h3>Update terbaru dari Wartop</h3>
              <p className="news-section-subtitle">Dapatkan tips, promo, dan highlight komunitas setiap minggunya.</p>
            </div>
            <a href="/blog" onClick={(event) => { event.preventDefault(); onNavigate('page', 'blog'); }} className="news-section-link">
              Lihat semua <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
          <div className="news-card-track">
            <a href="/blog" onClick={(event) => { event.preventDefault(); onNavigate('page', 'blog'); }} className="news-card">
              <div className="news-card-thumb">
                <img src={productImages['mobile-legend']} alt="Mobile Legends" onError={(event) => { event.currentTarget.src = '/wartop-mark.png'; }} />
              </div>
              <div className="news-card-content">
                <h4 className="news-card-title">Promo Diamond Mobile Legends Merdeka 2026</h4>
                <p className="news-card-description">Rayakan bulan kemerdekaan dengan promo diskon up to 15% top up Diamond Mobile Legends hanya di Wartop!</p>
                <span className="news-card-cta">Baca selengkapnya &rarr;</span>
              </div>
            </a>
            <a href="/blog" onClick={(event) => { event.preventDefault(); onNavigate('page', 'blog'); }} className="news-card">
              <div className="news-card-thumb">
                <img src={productImages['free-fire']} alt="Free Fire" onError={(event) => { event.currentTarget.src = '/wartop-mark.png'; }} />
              </div>
              <div className="news-card-content">
                <h4 className="news-card-title">Event Top Up Free Fire x Spider-Man</h4>
                <p className="news-card-description">Dapatkan token eksklusif kolaborasi FF x Spider-Man dengan melakukan top up minimal 100 Diamonds di Wartop.</p>
                <span className="news-card-cta">Baca selengkapnya &rarr;</span>
              </div>
            </a>
            <a href="/blog" onClick={(event) => { event.preventDefault(); onNavigate('page', 'blog'); }} className="news-card">
              <div className="news-card-thumb">
                <img src={brandMark} alt="Wartop" className="news-card-brand-mark" onError={(event) => { event.currentTarget.src = '/wartop-mark.png'; }} />
              </div>
              <div className="news-card-content">
                <h4 className="news-card-title">Tips Aman Top Up Akun Game Online</h4>
                <p className="news-card-description">Pastikan akun game kamu aman! Pelajari tips top up tanpa memasukkan password dan menghindari scam digital shop.</p>
                <span className="news-card-cta">Baca selengkapnya &rarr;</span>
              </div>
            </a>
          </div>
        </div>

        {/* 4. FLASH SALE — ditempatkan setelah berita agar alur beranda lebih editorial */}
        <FlashSale products={visibleProducts} onSelectProduct={onSelectProduct} />

        {/* 5. FAQ SECTION */}
        <section className="gvx-faq-section mb-4" aria-labelledby="faqTitle">
          <div className="gvx-faq-container">
            <div className="gvx-faq-wrapper">
              <header className="gvx-faq-header">
                <div className="gvx-faq-heading">
                  <span className="gvx-faq-badge">FAQ</span>
                  <h2 id="faqTitle" className="gvx-faq-title">Hal yang paling sering ditanyakan</h2>
                </div>
                <p className="gvx-faq-copy">Temukan jawaban singkat terkait pengalaman top up, opsi pembayaran, hingga cara mendapatkan bantuan dari tim Wartop.</p>
                <div className="gvx-faq-chips" role="list">
                  <span className="gvx-faq-chip" role="listitem">Dukungan 24/7</span>
                  <span className="gvx-faq-chip" role="listitem">Transaksi Anti Ribet</span>
                  <span className="gvx-faq-chip gvx-faq-chip--promo" role="listitem">Promo Tiap Minggu</span>
                </div>
              </header>

              <div className="gvx-faq-highlights">
                <article className="gvx-faq-highlight">
                  <span className="gvx-faq-highlight-badge">Instan</span>
                  <h3 className="gvx-faq-highlight-title">Top up cuma hitungan detik</h3>
                  <p className="gvx-faq-highlight-copy">Balance langsung masuk setelah pembayaran berhasil tanpa perlu menunggu lama.</p>
                </article>
                <article className="gvx-faq-highlight">
                  <span className="gvx-faq-highlight-badge">Fleksibel</span>
                  <h3 className="gvx-faq-highlight-title">Metode pembayaran lengkap</h3>
                  <p className="gvx-faq-highlight-copy">Dari QRIS, virtual account bank, Saldo Wartop, sampai minimarket—pilih cara yang paling nyaman buat kamu.</p>
                </article>
                <article className="gvx-faq-highlight">
                  <span className="gvx-faq-highlight-badge">Support</span>
                  <h3 className="gvx-faq-highlight-title">Tim bantuan yang selalu siap</h3>
                  <p className="gvx-faq-highlight-copy">WhatsApp kami aktif 24 jam untuk memastikan pengalaman top up kamu selalu mulus.</p>
                </article>
              </div>

              <div className="accordion gvx-faq-accordion" id="faqAccordion">
                <div className="accordion-item">
                  <h3 className="accordion-header" id="faqHeadingOne">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseOne" aria-expanded="false" aria-controls="faqCollapseOne">
                      <span className="gvx-faq-question">Apa itu Wartop?</span>
                      <span className="gvx-faq-toggle" aria-hidden="true"></span>
                    </button>
                  </h3>
                  <div id="faqCollapseOne" className="accordion-collapse collapse" aria-labelledby="faqHeadingOne" data-bs-parent="#faqAccordion">
                    <div className="accordion-body gvx-faq-body">
                      <strong>Wartop</strong> merupakan tempat terpercaya untuk kamu beli voucher game dan juga top up game. Kami menyediakan banyak sekali game terkenal seperti Free Fire, Mobile Legends, Genshin Impact, PUBG, Valorant dan kamu masih bisa menemukan lebih dari 100+ game.
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h3 className="accordion-header" id="faqHeadingTwo">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseTwo" aria-expanded="false" aria-controls="faqCollapseTwo">
                      <span className="gvx-faq-question">Kenapa memilih Wartop?</span>
                      <span className="gvx-faq-toggle" aria-hidden="true"></span>
                    </button>
                  </h3>
                  <div id="faqCollapseTwo" className="accordion-collapse collapse" aria-labelledby="faqHeadingTwo" data-bs-parent="#faqAccordion">
                    <div className="accordion-body gvx-faq-body">
                      Kami tahu kalau waktu kamu sangat berharga! Untuk itu kami membuatnya lebih mudah, sehingga proses top up game sangat cepat. Setelah kamu melakukan pembayaran, voucher game akan langsung masuk ke akunmu tanpa delay. Selain itu, kami juga menyediakan metode pembayaran yang lengkap, kamu bisa top up kapan saja, di mana saja.
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h3 className="accordion-header" id="faqHeadingThree">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faqCollapseThree" aria-expanded="false" aria-controls="faqCollapseThree">
                      <span className="gvx-faq-question">Bagaimana cara beli voucher game?</span>
                      <span className="gvx-faq-toggle" aria-hidden="true"></span>
                    </button>
                  </h3>
                  <div id="faqCollapseThree" className="accordion-collapse collapse" aria-labelledby="faqHeadingThree" data-bs-parent="#faqAccordion">
                    <div className="accordion-body gvx-faq-body">
                      <p><strong>Gampang banget:</strong></p>
                      <ul>
                        <li>Pilih game yang kamu mainkan di halaman utama website</li>
                        <li>Masukkan ID akun kamu</li>
                        <li>Pilih jumlah yang ingin kamu top up</li>
                        <li>Bayar dengan metode yang kamu mau</li>
                        <li>Voucher langsung masuk ke game!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>{/* end container col-md-8 */}

      {/* 5. MAIN DESCRIPTION / SEO SECTION */}
      <div className="main-description-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-12">
              <div className="main-description-content">
                <h1 className="main-description-heading">
                  <span className="heading-lead">Tempat top up voucher game murah,</span>
                  <span className="heading-accent">Beli voucher game sekarang!</span>
                </h1>
                <p className="main-description-copy">Wartop adalah tempat terbaik untuk top up game yang menyediakan banyak pilihan voucher. Kamu ingin beli diamond atau voucher hiburan? Semua bisa kamu dapatkan di sini. Proses top up-nya gampang dan metode pembayarannya lengkap. Yuk, beli voucher game di Wartop dan dapatkan peluang bonus voucher!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
