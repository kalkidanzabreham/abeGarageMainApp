import React from 'react'
import bannerImage from "../../assets/images/banner/banner.jpg";
function Contact() {
  return (
    <section class="contact-section">
      <section className="video-section contact-bg">
        <div data-parallax='{"y": 50}' class="sec-bg">
          <img src={bannerImage} alt="banner image" />
        </div>
        <div class="auto-container">
          <h2>Contact</h2>
          <ul class="page-breadcrumb">
            <li>
              <a href="index.html">home</a>
            </li>
            <li>Contact</li>
          </ul>
        </div>
      </section>
      <div class="auto-container">
        <div class="contact-title m-5">
          <h2>Drop us message</h2>
          <div class="text">
            Praising pain was born and I will give you a complete account of the
            system, and{" "}
          </div>
        </div>
        <div class="row clearfix">
          <div class="form-column col-lg-7">
            <div class="inner-column">
              <section class="map-section">
                <div class="contact-map">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3071.2910802067827!2d90.45905169331171!3d23.691532202989123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sbd!4v1577214205224!5m2!1sen!2sbd"
                    width="600"
                    height="470"
                    style={{ border: "0", width: "100%" }}
                    allowfullscreen=""
                  ></iframe>
                </div>

                <div className="bg-danger p-5 text-white  mt-3 d-flex justify-content-center align-items-center">
                  <div class="phone-number">
                    Schedule Your Appontment Today :{" "}
                    <strong className='mr-5'>1800 456 7890</strong>
                    <button className="p-3  " style={{ marginRight: "5px" }}>
                      CONTACT US
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="info-column col-lg-5">
            <div class="inner-column">
              <h4>Our Address</h4>
              <div class="text">
                Completely synergize resource taxing relationships via premier
                niche markets. Professionally cultivate one-to-one customer
                service.
              </div>
              <ul>
                <li>
                  <i class="flaticon-pin"></i>
                  <span>Address:</span> 54B, Tailstoi Town 5238 MT, La city, IA
                  5224
                </li>
                <li>
                  <i class="flaticon-email"></i>
                  <span>email:</span> contact@buildtruck.com
                </li>
                <li>
                  <i class="flaticon-phone"></i>
                  <span>phone:</span> 1800 456 7890 / 1254 897 3654
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact