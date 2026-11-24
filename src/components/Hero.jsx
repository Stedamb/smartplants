import {Link} from "react-router";
import {styles} from '../styles';
import {bg} from "../assets";

import { useTranslation } from "react-i18next";

const Hero = () => {
    const { t } = useTranslation();
    return (
        <section className='relative w-full h-screen mx-auto'>
            <img src={bg} className='w-full h-screen object-cover brightness-50'></img>
            <div
                className={`absolute inset-0 max-w-7xl mx-auto ${styles.paddingX} flex flex-col items-center justify-center text-center`}>
                <h1 className={`${styles.heroHeadText}`}>
                    {t("title_highlighted")}
                </h1>
                <p className={`${styles.heroSubText} mt-2`}>
                    {t("subtitle")}
                </p>
                <Link
                    to="/dashboard"
                    className="mt-10 rounded-[20px] bg-[var(--cta)] px-8 py-4 text-lg font-bold text-white transition-colors duration-200 hover:bg-[var(--cta-hover)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                    {t("hero_cta")}
                </Link>
            </div>
        </section>
    )
}

export default Hero
