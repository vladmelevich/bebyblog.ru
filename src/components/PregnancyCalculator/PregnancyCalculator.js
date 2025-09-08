import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faBaby, faHeart } from '@fortawesome/free-solid-svg-icons';
import './PregnancyCalculator.css';

const PregnancyCalculator = () => {
  const navigate = useNavigate();
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [result, setResult] = useState(null);

  // Данные по неделям беременности
  const pregnancyData = {
    1: {
      week: 1,
      title: "1-2 недели: Зачатие",
      description: "Оплодотворение яйцеклетки происходит в маточной трубе.",
      advice: [
        "Принимайте фолиевую кислоту (400 мкг в день)",
        "Откажитесь от алкоголя и курения",
        "Начните вести здоровый образ жизни",
        "Избегайте стрессов"
      ],
      symptoms: "Обычно никаких симптомов еще нет"
    },
    2: {
      week: 2,
      title: "3-4 недели: Имплантация",
      description: "Оплодотворенная яйцеклетка имплантируется в стенку матки.",
      advice: [
        "Продолжайте принимать фолиевую кислоту",
        "Следите за питанием",
        "Избегайте токсичных веществ",
        "Начните принимать витамины для беременных"
      ],
      symptoms: "Возможны легкие кровянистые выделения при имплантации"
    },
    3: {
      week: 3,
      title: "5-6 недель: Первые признаки",
      description: "Начинается формирование основных органов и систем.",
      advice: [
        "Запишитесь к гинекологу",
        "Сдайте анализы крови и мочи",
        "Избегайте сырого мяса и рыбы",
        "Пейте больше воды"
      ],
      symptoms: "Тошнота, усталость, болезненность груди"
    },
    4: {
      week: 4,
      title: "7-8 недель: Развитие эмбриона",
      description: "Формируется сердце, начинается циркуляция крови.",
      advice: [
        "Первый УЗИ для подтверждения беременности",
        "Следите за весом",
        "Избегайте кофеина",
        "Больше отдыхайте"
      ],
      symptoms: "Усиление тошноты, частые мочеиспускания"
    },
    5: {
      week: 5,
      title: "9-10 недель: Критический период",
      description: "Формируются все основные органы и системы.",
      advice: [
        "Избегайте любых лекарств без консультации врача",
        "Не поднимайте тяжести",
        "Следите за температурой тела",
        "Правильно питайтесь"
      ],
      symptoms: "Тошнота, рвота, усталость, перепады настроения"
    },
    6: {
      week: 6,
      title: "11-12 недель: Завершение первого триместра",
      description: "Плацента полностью сформирована, риск выкидыша снижается.",
      advice: [
        "Скрининг первого триместра",
        "Начните заниматься специальной гимнастикой",
        "Следите за гигиеной полости рта",
        "Планируйте декретный отпуск"
      ],
      symptoms: "Тошнота может уменьшиться, живот начинает расти"
    },
    7: {
      week: 7,
      title: "13-16 недель: Второй триместр",
      description: "Период активного роста и развития плода.",
      advice: [
        "Начните носить одежду для беременных",
        "Занимайтесь плаванием или йогой",
        "Следите за прибавкой веса",
        "Готовьтесь к родам"
      ],
      symptoms: "Улучшение самочувствия, первые шевеления"
    },
    8: {
      week: 8,
      title: "17-20 недель: Середина беременности",
      description: "Плод активно двигается, формируются рефлексы.",
      advice: [
        "Скрининг второго триместра",
        "Начните общаться с малышом",
        "Следите за осанкой",
        "Готовьте детскую комнату"
      ],
      symptoms: "Ощутимые шевеления, рост живота"
    },
    9: {
      week: 9,
      title: "21-24 недели: Активное развитие",
      description: "Формируются органы чувств, плод реагирует на звуки.",
      advice: [
        "Следите за уровнем сахара в крови",
        "Избегайте длительного стояния",
        "Носите компрессионное белье",
        "Готовьтесь к родам"
      ],
      symptoms: "Регулярные шевеления, возможна изжога"
    },
    10: {
      week: 10,
      title: "25-28 недель: Третий триместр",
      description: "Плод готовится к жизни вне матки.",
      advice: [
        "Следите за давлением",
        "Избегайте стрессов",
        "Готовьте сумку в роддом",
        "Изучайте дыхательные техники"
      ],
      symptoms: "Одышка, отеки, бессонница"
    },
    11: {
      week: 11,
      title: "29-32 недели: Финальная подготовка",
      description: "Плод занимает правильное положение для родов.",
      advice: [
        "Регулярные визиты к врачу",
        "Следите за шевелениями",
        "Готовьте документы для роддома",
        "Изучайте процесс родов"
      ],
      symptoms: "Частые мочеиспускания, боли в спине"
    },
    12: {
      week: 12,
      title: "33-36 недель: Предродовой период",
      description: "Организм готовится к родам.",
      advice: [
        "Следите за предвестниками родов",
        "Готовьте детские вещи",
        "Изучайте уход за новорожденным",
        "Планируйте роды"
      ],
      symptoms: "Тренировочные схватки, опущение живота"
    },
    13: {
      week: 13,
      title: "37-40 недель: Доношенная беременность",
      description: "Малыш готов к рождению в любой момент.",
      advice: [
        "Будьте готовы к родам",
        "Следите за схватками",
        "Поддерживайте связь с врачом",
        "Готовьтесь к встрече с малышом"
      ],
      symptoms: "Регулярные схватки, отхождение вод"
    }
  };

  const calculatePregnancy = () => {
    if (!lastPeriodDate) {
      alert('Пожалуйста, введите дату последней менструации');
      return;
    }

    const lastPeriod = new Date(lastPeriodDate);
    const today = new Date();
    
    // Расчет срока беременности (обычно считается от первого дня последней менструации)
    const diffTime = today - lastPeriod;
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    // Расчет предполагаемой даты родов (40 недель от последней менструации)
    const dueDate = new Date(lastPeriod);
    dueDate.setDate(dueDate.getDate() + 280); // 40 недель = 280 дней
    
    // Определяем текущую неделю беременности
    let currentWeek;
    if (diffWeeks < 1) {
      currentWeek = 1;
    } else if (diffWeeks > 40) {
      currentWeek = 13; // После 40 недель
    } else {
      currentWeek = Math.min(Math.ceil(diffWeeks / 3) + 1, 13);
    }

    setResult({
      currentWeek: diffWeeks,
      dueDate: dueDate,
      weekData: pregnancyData[currentWeek] || pregnancyData[13]
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="pregnancy-calculator">
      <div className="calculator-header">
        <h1>Калькулятор беременности</h1>
        <p className="header-subtitle">Рассчитайте дату родов и получите советы по неделям беременности</p>
      </div>

      <div className="calculator-content">
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="lastPeriod">
              <FontAwesomeIcon icon={faCalendarAlt} />
              Дата последней менструации:
            </label>
            <input
              type="date"
              id="lastPeriod"
              value={lastPeriodDate}
              onChange={(e) => setLastPeriodDate(e.target.value)}
              className="date-input"
            />
          </div>
          
          <button 
            className="calculate-button"
            onClick={calculatePregnancy}
            disabled={!lastPeriodDate}
          >
            <FontAwesomeIcon icon={faBaby} />
            Рассчитать
          </button>
        </div>

        {result && (
          <div className="result-section">
            <div className="pregnancy-info">
              <h2>Информация о беременности</h2>
              <div className="info-cards">
                <div className="info-card">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <div>
                    <h3>Текущий срок</h3>
                    <p>{result.currentWeek} недель</p>
                  </div>
                </div>
                <div className="info-card">
                  <FontAwesomeIcon icon={faBaby} />
                  <div>
                    <h3>Предполагаемая дата родов</h3>
                    <p>{formatDate(result.dueDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="week-advice">
              <h2>{result.weekData.title}</h2>
              <p className="week-description">{result.weekData.description}</p>
              
              <div className="advice-sections">
                <div className="advice-section">
                  <h3>
                    <FontAwesomeIcon icon={faHeart} />
                    Рекомендации
                  </h3>
                  <ul>
                    {result.weekData.advice.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="advice-section">
                  <h3>Возможные симптомы</h3>
                  <p>{result.weekData.symptoms}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PregnancyCalculator;