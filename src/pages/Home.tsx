import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, Clock, MapPin, MessageCircle, ShieldCheck, Wallet } from 'lucide-react';
import { FoodCard } from '../components/FoodCard';
import { FoodImage } from '../components/FoodImage';
import { PublicLayout } from '../components/PublicLayout';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const WHY_CHOOSE_FEATURES = [
  {
    icon: ChefHat,
    title: 'Freshly Prepared Meals',
    description:
      'We prepare delicious meals daily with close attention to quality, hygiene, and freshness.',
  },
  {
    icon: ShieldCheck,
    title: 'Authentic Nigerian Taste',
    description:
      'Enjoy the rich spices, smoky aroma, and comfort of traditional Nigerian home-style cooking.',
  },
  {
    icon: Wallet,
    title: 'Affordable Prices',
    description:
      'Satisfying portions at fair prices in Nigerian Naira that offer real value for your money.',
  },
  {
    icon: MessageCircle,
    title: 'Easy Ordering',
    description:
      'Browse our live menu, pick your meal, and send your order request conveniently via WhatsApp.',
  },
];

export const Home: React.FC = () => {
  const { settings, foods, categories, loading } = useRestaurant();

  useDocumentTitle(
    'Unique Restaurant | Delicious Nigerian Food in Osogbo',
    'Enjoy delicious Nigerian meals at Unique Restaurant, located in Owo Ede, Osogbo, Osun State. Explore our menu and order your favourite meals.'
  );

  const heroHeading = settings?.hero_heading || 'Delicious Nigerian Meals, Made With Love.';
  const heroSubtext =
    settings?.hero_subtext ||
    "Experience the rich taste of authentic Nigerian cuisine. From delicious rice dishes to traditional local delicacies, there's always something special waiting for you at Unique Restaurant.";
  const heroImage =
    settings?.hero_image_url || '/src/assets/images/hero_jollof_feast_1795437995489.jpg';
  const location = settings?.location || 'Owo Ede, Osogbo, Osun State, Nigeria';

  const featuredFoods = foods.filter((f) => f.is_featured).slice(0, 6);
  const displayedFoods = featuredFoods.length > 0 ? featuredFoods : foods.slice(0, 6);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-[#111111] text-white overflow-hidden">
        <div className="absolute inset-0">
          <FoodImage
            src={heroImage}
            alt="Plate of smoky Nigerian Jollof rice with roasted chicken and fried plantain at Unique Restaurant"
            loading="eager"
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-[#EA580C] mb-4">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{location}</span>
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
              {heroHeading}
            </h1>

            <p className="text-base sm:text-lg text-neutral-200 leading-relaxed mb-8 max-w-xl">
              {heroSubtext}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] rounded-lg transition-colors duration-150 whitespace-nowrap"
              >
                <span>Explore Our Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/menu"
                className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg transition-colors duration-150 whitespace-nowrap"
              >
                Order Your Favourite Meal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Meals Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight mb-2">
                Our Delicious Meals
              </h2>
              <p className="text-neutral-600 text-base max-w-xl">
                Explore some of the delicious meals prepared to satisfy your cravings.
              </p>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C81E1E] hover:text-[#991B1B] whitespace-nowrap shrink-0"
            >
              <span>View Full Menu</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-neutral-200 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-neutral-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-neutral-200 rounded w-1/3" />
                    <div className="h-5 bg-neutral-200 rounded w-2/3" />
                    <div className="h-4 bg-neutral-100 rounded w-full" />
                    <div className="h-10 bg-neutral-200 rounded w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedFoods.length === 0 ? (
            <div className="border border-neutral-200 rounded-xl p-10 text-center bg-neutral-50">
              <p className="text-neutral-700 font-medium mb-2">Menu items are being updated.</p>
              <Link to="/contact" className="text-sm font-semibold text-[#C81E1E] hover:underline">
                Contact us on WhatsApp to ask what is cooking today
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {displayedFoods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 sm:py-24 bg-[#F9F8F6] border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight mb-3">
              Why Choose Unique Restaurant?
            </h2>
            <p className="text-neutral-600 text-base">
              Every plate is cooked with care for residents, students, families, and visitors across Osogbo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col"
                >
                  <div className="w-11 h-11 rounded-lg bg-red-50 text-[#C81E1E] flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#111111] mb-2">{feature.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Food Categories */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight mb-2">
                Popular Food Categories
              </h2>
              <p className="text-neutral-600 text-base">
                Browse our kitchen by your favourite Nigerian dish category.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Clock className="w-4 h-4 text-[#EA580C]" />
              <span>{settings?.opening_hours || 'Fresh meals served daily'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat, idx) => {
              const count = foods.filter((f) => f.category_id === cat.id && f.is_available).length;
              return (
                <Link
                  key={cat.id}
                  to={`/menu?category=${encodeURIComponent(cat.slug)}`}
                  className="group p-5 bg-white border border-neutral-200 hover:border-[#C81E1E] rounded-xl transition-colors duration-150 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-medium text-[#EA580C] tabular-nums">
                      0{idx + 1}.
                    </span>
                    <h3 className="text-base font-semibold text-[#111111] group-hover:text-[#C81E1E] transition-colors mt-1.5 mb-1">
                      {cat.name}
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <span className="tabular-nums">{count} meals available</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#C81E1E] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA Banner */}
      <section className="relative bg-[#111111] text-white overflow-hidden">
        <div className="absolute inset-0">
          <FoodImage
            src="/src/assets/images/about_dining_spread_1795437995073.jpg"
            alt="Freshly served Nigerian meals shared around the dining table"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 to-black/50" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
            Craving Something Delicious?
          </h2>
          <p className="text-base sm:text-lg text-neutral-200 mb-8 max-w-xl mx-auto">
            Your favourite Nigerian meals are just a few clicks away.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] rounded-lg transition-colors duration-150"
          >
            <span>Order Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};
