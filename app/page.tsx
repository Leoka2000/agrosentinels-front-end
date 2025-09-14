"use client";
import React, {useState} from "react";
import Image from "next/image";
import Banner from "@/components/Banner";

export default function Home() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="bg-background">
      <Banner />
      <section className="w-full min-h-screen overflow-x-clip relative isolate px-3 from-gray-900 via-black to-gray-800 antialiased bg-gradient-to-br bg-neutral-900 lg:px-6">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 animate-blur-move"
        >
          <div
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
            className="relative sm:w-288.75 left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#58f7c2] to-[#00532f] opacity-30 sm:left-[calc(50%-30rem)]"
          ></div>
        </div>

        <div className="mx-auto max-w-7xl relative">
          <nav className="flex items-center w-full h-24 select-none">
            <div className="relative flex flex-wrap items-start justify-between w-full mx-auto font-medium md:items-center md:h-24 md:justify-between">
              <a
                href="#_"
                className="flex items-center w-1/4 py-4 pl-6 pr-4 space-x-2 font-extrabold text-white md:py-0"
              >
               <Image
                 src="/as-logo.png"
                 alt="Logo"
                 width={250}
                 height={250}
                 className="mx-auto mb-4 invert brightness-0"
                 priority
               />
              </a>

              {/* Desktop menu */}
              <div className="hidden md:flex absolute z-50 flex-col items-center justify-center w-full h-auto px-2 text-center text-gray-400 border-0 border-gray-700 rounded-full md:border md:w-auto md:h-10 left-1/2 md:flex-row md:items-center -translate-x-1/2">
                <a
                  href="#"
                  className="relative inline-block w-full h-full px-4 py-5 mx-2 font-medium leading-tight text-center text-white md:py-2 group md:w-auto md:px-2 lg:mx-3 md:text-center"
                >
                  <span>Home</span>
                  <span className="absolute bottom-0 left-0 w-full h-px duration-300 ease-out translate-y-px bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700"></span>
                </a>
                <a
                  href="#"
                  className="relative inline-block w-full h-full px-4 py-5 mx-2 font-medium leading-tight text-center duration-300 ease-out md:py-2 group hover:text-white md:w-auto md:px-2 lg:mx-3 md:text-center"
                >
                  <span>Features</span>
                  <span className="absolute bottom-0 w-0 h-px duration-300 ease-out translate-y-px group-hover:left-0 left-1/2 group-hover:w-full bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700"></span>
                </a>
                <a
                  href="#"
                  className="relative inline-block w-full h-full px-4 py-5 mx-2 font-medium leading-tight text-center duration-300 ease-out md:py-2 group hover:text-white md:w-auto md:px-2 lg:mx-3 md:text-center"
                >
                  <span>Blog</span>
                  <span className="absolute bottom-0 w-0 h-px duration-300 ease-out translate-y-px group-hover:left-0 left-1/2 group-hover:w-full bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700"></span>
                </a>
                <a
                  href="https://zane.hu/contact/" target="_blank"
                  className="relative inline-block w-full h-full px-4 py-5 mx-2 font-medium leading-tight text-center duration-300 ease-out md:py-2 group hover:text-white md:w-auto md:px-2 lg:mx-3 md:text-center"
                >
                  <span>Contact</span>
                  <span className="absolute bottom-0 w-0 h-px duration-300 ease-out translate-y-px group-hover:left-0 left-1/2 group-hover:w-full bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700"></span>
                </a>
              </div>

              {/* Desktop Login/Signup */}
              <div className="fixed top-0 left-0 z-40 items-center hidden w-full h-full p-3 text-sm bg-gray-900 bg-opacity-50 md:w-auto md:bg-transparent md:p-0 md:relative md:flex">
                <div className="flex-col items-center w-full h-full p-3 overflow-hidden bg-black bg-opacity-50 rounded-lg select-none md:p-0 backdrop-blur-lg md:h-auto md:bg-transparent md:rounded-none md:relative md:flex md:flex-row md:overflow-auto">
                  <div className="flex flex-col items-center justify-end w-full h-full pt-2 md:w-full md:flex-row md:py-0">
                    <a
                      href="login"
                      className="w-full py-5 mr-0 text-center text-gray-200 md:py-3 md:w-auto hover:text-white md:pl-0 md:mr-3 lg:mr-5"
                    >
                      Login
                    </a>
                    <a
                      href="register"
                      className="inline-flex items-center justify-center w-full px-4 py-3 md:py-1.5 font-medium leading-6 text-center whitespace-no-wrap duration-150 ease-in-out md:mr-1 text-gray-900 bg-emerald-300 rounded-full border border-transparent xl:px-10 md:w-auto transition hover:bg-emerald-200 md:w-auto"
                    >
                      Sign Up
                    </a>
                  </div>
                </div>
              </div>

              {/* Mobile menu button */}
              <div
                className="absolute right-0 z-50 flex flex-col items-end text-gray-200 translate-y-1.5 w-10 h-10 p-2 mr-4 rounded-full cursor-pointer md:hidden hover:bg-gray-200/10 hover:bg-opacity-10"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                )}
              </div>
            </div>
          </nav>

          {/* Blur only the main page content container when menu is open */}
          <div
            className={`transition-all duration-300 ${
              mobileMenuOpen ? "blur-sm" : ""
            }`}
          >
            {/* Page content */}
            <div className="container px-6 md:py-32 py-8 mt-5 mx-auto md:text-center md:px-4">
              <h1 className="text-4xl font-extrabold leading-none tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl">
                <span className="block">
                 Diagnostic Measuring System. <br />
                 We take care of your machines
                </span>
              </h1>
              <p className="mx-auto mt-6 text-sm text-left text-gray-200 md:text-center md:mt-12 sm:text-base md:max-w-xl md:text-lg xl:text-xl">
                Expertise in designing highly reliable electronic circuits, now
                with a dashboard for you to analyse and monitor the activity of
                your devices.
              </p>
              <div className="relative flex items-center mx-auto md:mt-10 mt-3 overflow-hidden text-left rounded-md md:max-w-sm md:text-center">
                <div className="flex flex-col justify-center items-center mt-8  text-center sm:flex-row sm:space-y-0 sm:space-x-4">
                  <span className="inline-flex relative w-full md:w-auto">
                    <a
                      href="register"
                      className="inline-flex justify-center items-center px-8 py-4 mt-2 w-full text-base font-medium leading-6 text-gray-900 bg-emerald-300 rounded-full border border-transparent xl:px-10 md:w-auto transition hover:bg-emerald-200 "
                    >
                      Get started
                    </a>
                  </span>
                  <span className="inline-flex relative w-full md:w-auto">
                    <a
                      href="https://zane.hu/"
                      target="_blank"
                      className="inline-flex justify-center items-center px-8 py-4  my-2 transition text-base font-medium leading-6 text-white bg-gray-900 rounded-full border border-transparent xl:px-10 md:w-auto hover:bg-gray-800 "
                      rel="noreferrer"
                    >
                      Main website
                    </a>
                  </span>
                </div>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            >
              <div
                style={{
                  clipPath:
                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                }}
                className="relative sm:w-288.75 left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#58f7c2] to-[#00532f] opacity-30 sm:left-[calc(50%-30rem)]"
              ></div>
            </div>
          </div>

          {/* Overlay dimmer behind menu */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-40"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="fixed top-24 left-0 right-0 z-50 mx-6 rounded-md p-6 space-y-4 bg-gray-900 text-white md:hidden">
              <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">
                Home
              </a>
              <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">
                Features
              </a>
              <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">
                Blog
              </a>
              <a href="https://zane.hu/contact/" target="_blank" className="block px-3 py-2 rounded hover:bg-gray-700">
                Contact
              </a>
              <a
                href="login"
                className="block px-3 py-2 rounded hover:bg-gray-700"
              >
                Login
              </a>
              <a
                href="register"
                className="block px-3 py-2 rounded bg-emerald-300 text-gray-900 hover:bg-emerald-200 rounded-full text-center"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
