import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FoodImage } from '../components/FoodImage';
import { PublicLayout } from '../components/PublicLayout';
import { useRestaurant } from '../context/RestaurantContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const VALUES = [
  {
    index: '01.',
    name: 'Quality',
    detail: 'Carefully sourced ingredients and attentive preparation in every single pot.',
  },
  {
    index: '02.',
    name: 'Freshness',
    detail: 'Meals prepared fresh daily so every plate arrives hot, fragrant, and vibrant.',
  },
  {
    index: '03.',
    name: 'Customer Satisfaction',
    detail: 'Warm, respectful service whether you dine in, pick up, or order via WhatsApp.',
  },
  {
    index: '04.',
    name: 'Affordability',
    detail: 'Generous portions priced fairly so great Nigerian meals remain accessible to all.',
  },
  {
    index: '05.',
    name: 'Authentic Nigerian Taste',
    detail: 'Honest traditional recipes true to classic Osun and Nigerian home cooking.',
  },
];

export const About: React.FC = () => {
  const { settings } = useRestaurant();

  useDocumentTitle(
    'About Us | Unique Restaurant Osogbo',
    'Discover the story, mission, vision, and values behind Unique Restaurant in Owo Ede, Osogbo, Osun State.'
  );

  const storyText =
    settings?.about_story ||
    'At Unique Restaurant, we believe that good food brings people together. Our passion is serving delicious Nigerian meals prepared with care, quality ingredients, and a commitment to satisfying every customer.\n\nFrom popular rice dishes to traditional Nigerian delicacies, we aim to give every customer a memorable food experience.\n\nLocated in Owo Ede, Osogbo, Unique Restaurant is dedicated to making delicious Nigerian food accessible to everyone.';

  const mission =
    settings?.mission_statement ||
    'To serve delicious, affordable, and satisfying Nigerian meals while creating a welcoming experience for every customer.';

  const vision =
    settings?.vision_statement ||
    'To become a trusted and recognized food destination known for quality, great taste, and excellent customer satisfaction.';

  const paragraphs = storyText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <PublicLayout>
      {/* Page Hero */}
      <section className="relative bg-[#111111] text-white overflow-hidden">
        <div className="absolute inset-0">
          <FoodImage
            src="/src/assets/images/about_dining_spread_1795437995073.jpg"
            alt="Unique Restaurant dining table spread"
            loading="eager"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-[#EA580C] mb-3">Owo Ede, Osogbo</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
              About Unique Restaurant
            </h1>
            <p className="text-lg sm:text-xl text-neutral-200">
              Good Food. Great Taste. A Unique Experience.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-semibold text-[#C81E1E] mb-2">Who We Are</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-neutral-700 text-base leading-relaxed">
                {paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[320px] rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100">
                <FoodImage
                  src="/src/assets/images/dish_ofada_rice_1795437997200.jpg"
                  alt="Traditional Nigerian Ofada rice and Ayamase sauce served at Unique Restaurant"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20 bg-[#F9F8F6] border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-neutral-200 rounded-2xl p-8">
              <p className="text-xs font-semibold text-[#C81E1E] mb-2">Purpose</p>
              <h2 className="font-display text-2xl font-bold text-[#111111] mb-4">Our Mission</h2>
              <p className="text-neutral-700 leading-relaxed text-base">{mission}</p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-8">
              <p className="text-xs font-semibold text-[#EA580C] mb-2">Direction</p>
              <h2 className="font-display text-2xl font-bold text-[#111111] mb-4">Our Vision</h2>
              <p className="text-neutral-700 leading-relaxed text-base">{vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight mb-3">
              Our Values
            </h2>
            <p className="text-neutral-600 text-base">
              The everyday standards that guide our kitchen and customer care in Osogbo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {VALUES.map((val) => (
              <div
                key={val.name}
                className="border border-neutral-200 rounded-xl p-6 bg-white flex flex-col"
              >
                <span className="text-sm font-bold text-[#C81E1E] tabular-nums mb-3">
                  {val.index}
                </span>
                <h3 className="text-lg font-semibold text-[#111111] mb-2">{val.name}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{val.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 sm:py-20 bg-[#111111] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-6">
            Come Experience Something Delicious.
          </h2>
          <Link
            to="/menu"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#991B1B] rounded-lg transition-colors"
          >
            <span>Explore Our Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};
