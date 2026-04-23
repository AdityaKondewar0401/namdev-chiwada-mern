import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import QuantityStepper from './QuantityStepper';

// ── Individual Product Card ────────────────────────────
function NamkeenCard({ product, index }) {
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  const navigate = useNavigate();

  // FIXED: Use front hero image first
  const images = [
    product.img,
    ...(product.images || []).filter(
      (img) => img !== product.img
    ),
  ].filter(Boolean);

  const sizes =
    product.sizes?.length > 0
      ? product.sizes
      : [
          {
            weight:
              product.weight,
            price:
              product.price,
          },
        ];

  const currentSize =
    sizes[selectedSizeIdx];

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 40,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.6,
        delay:
          index * 0.1,
      }}
      whileHover={{
        y: -8,
        boxShadow:
          '0 20px 60px rgba(224,112,0,0.18)',
      }}
      onClick={() =>
        navigate(
          `/products/${product._id}`
        )
      }
      className="bg-white rounded-3xl overflow-hidden flex flex-col cursor-pointer group"
      style={{
        boxShadow:
          '0 4px 24px rgba(45,26,0,0.08)',
      }}
    >
      {/* IMAGE */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio:
            '4/3',
        }}
      >
        {/* Out of stock */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gray-700">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badge */}
        {product.badge &&
          product.inStock && (
            <div className="absolute top-3 left-3 z-10">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{
                  background:
                    product.badgeColor ||
                    '#e07000',
                }}
              >
                {
                  product.badge
                }
              </span>
            </div>
          )}

        {/* Wishlist */}
        <button
          onClick={(
            e
          ) => {
            e.stopPropagation();
            setWishlisted(
              !wishlisted
            );
          }}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          style={{
            color:
              wishlisted
                ? '#e53e3e'
                : '#a07050',
          }}
        >
          {wishlisted
            ? '♥'
            : '♡'}
        </button>

        {/* Main Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={
              activeImg
            }
            src={
              images[
                activeImg
              ]
            }
            alt={
              product.name
            }
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            initial={{
              opacity: 0,
              scale: 1.04,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.3,
            }}
          />
        </AnimatePresence>

        {/* Marathi name */}
        {product.namMarathi && (
          <div
            className="absolute bottom-0 left-0 right-0 px-4 py-3"
            style={{
              background:
                'linear-gradient(to top,rgba(45,26,0,0.65),transparent)',
            }}
          >
            <span
              style={{
                fontFamily:
                  "'Gotu',sans-serif",
                color:
                  'rgba(255,255,255,0.9)',
                fontSize:
                  '0.85rem',
              }}
            >
              {
                product.namMarathi
              }
            </span>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
        {/* Tag */}
        {product.tag && (
          <div
            className="text-xs font-bold tracking-widest uppercase mb-1"
            style={{
              color:
                '#e07000',
            }}
          >
            {product.tag}
          </div>
        )}

        {/* Name */}
        <h3 className="font-serif font-black text-brown-dark text-xl leading-tight mb-1">
          {product.name}
        </h3>

        {/* Intro */}
        {product.intro && (
          <p className="text-xs text-brown-mid/60 mb-3 leading-relaxed line-clamp-2">
            {
              product.intro
            }
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-0.5">
            {[...Array(5)].map(
              (
                _,
                i
              ) => (
                <span
                  key={
                    i
                  }
                  className="text-sm"
                  style={{
                    color:
                      i <
                      Math.floor(
                        product.rating ||
                          0
                      )
                        ? '#f59e0b'
                        : '#d1d5db',
                  }}
                >
                  ★
                </span>
              )
            )}
          </div>

          <span className="text-xs text-brown-mid/60">
            (
            {
              product.reviews
            }
            )
          </span>
        </div>

        {/* Size Selector */}
        <div
          className="mb-4"
          onClick={(
            e
          ) =>
            e.stopPropagation()
          }
        >
          <div className="text-xs font-bold uppercase tracking-wider text-brown-dark mb-2">
            Net Weight
          </div>

          <div className="flex gap-2 flex-wrap">
            {sizes.map(
              (
                size,
                i
              ) => (
                <button
                  key={
                    i
                  }
                  onClick={(
                    e
                  ) => {
                    e.stopPropagation();
                    setSelectedSizeIdx(
                      i
                    );
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200"
                  style={{
                    background:
                      selectedSizeIdx ===
                      i
                        ? '#e07000'
                        : 'transparent',
                    borderColor:
                      selectedSizeIdx ===
                      i
                        ? '#e07000'
                        : 'rgba(224,112,0,0.3)',
                    color:
                      selectedSizeIdx ===
                      i
                        ? '#fff'
                        : '#e07000',
                  }}
                >
                  {
                    size.weight
                  }
                </button>
              )
            )}
          </div>
        </div>

        {/* Price + Quantity */}
        <div
          className="flex items-center gap-3 mt-auto"
          onClick={(
            e
          ) =>
            e.stopPropagation()
          }
        >
          <div className="flex-shrink-0">
            <div
              className="text-2xl font-black"
              style={{
                color:
                  '#e07000',
              }}
            >
              ₹
              {
                currentSize.price
              }
            </div>

            <div className="text-xs text-brown-mid/50">
              MRP incl. of
              all taxes
            </div>
          </div>

          <div className="flex-1">
            <QuantityStepper
              product={
                product
              }
              size={
                currentSize.weight
              }
              price={
                currentSize.price
              }
              disabled={
                !product.inStock
              }
            />
          </div>
        </div>
      </div>

      {/* Bottom Accent */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg,${
            product.badgeColor ||
            '#e07000'
          },transparent)`,
        }}
      />
    </motion.div>
  );
}

// ── SECTION ────────────────────────────
export default function NamkeenSection() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    productAPI
      .getAll({
        featured:
          'true',
        limit: 4,
        sort: 'popular',
      })
      .then((res) =>
        setProducts(
          res.data
            .products ||
            []
        )
      )
      .catch(() => {})
      .finally(() =>
        setLoading(
          false
        )
      );
  }, []);

  return (
    <section
      className="relative py-20 overflow-hidden"
      style={{
        background:
          '#fffdf7',
      }}
    >
      {/* Top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg,transparent,#d4af37,transparent)',
        }}
      />

      {/* Bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg,transparent,#d4af37,transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <div
              className="h-px w-16 sm:w-24"
              style={{
                background:
                  'linear-gradient(to right,transparent,#d4af37)',
              }}
            />
            <span className="text-xl">🌾</span>
            <div
              className="h-px w-16 sm:w-24"
              style={{
                background:
                  'linear-gradient(to left,transparent,#d4af37)',
              }}
            />
          </div>

          <div
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{
              color:
                '#e07000',
            }}
          >
            Our Collection
          </div>

          <h2 className="font-serif font-black text-brown-dark mb-3 text-4xl">
            Our Namkeen
            Collection
          </h2>

          <p className="text-brown-mid/60 text-sm italic">
            Crafted with
            tradition,
            served with
            love since
            1873
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(
              (i) => (
                <div
                  key={
                    i
                  }
                  className="rounded-3xl overflow-hidden"
                >
                  <div
                    className="skeleton w-full"
                    style={{
                      aspectRatio:
                        '4/3',
                    }}
                  />
                </div>
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(
              (
                product,
                i
              ) => (
                <NamkeenCard
                  key={
                    product._id
                  }
                  product={
                    product
                  }
                  index={
                    i
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
