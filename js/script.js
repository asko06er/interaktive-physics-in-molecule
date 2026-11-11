function startMoleculeAnimation(canvas, sideRails = false) {
    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = ['#ff354d', '#36a9ff', '#fff2a8'];
    const particles = [];
    let canvasWidth = 0;
    let canvasHeight = 0;
    let previousTime = 0;

    const railWidth = () => Math.min(74, Math.max(22, canvasWidth * 0.055));

    const particleBounds = (particle) => {
        if (!sideRails) {
            return { minX: particle.radius, maxX: canvasWidth - particle.radius };
        }

        const width = railWidth();
        return particle.rail === 0
            ? { minX: particle.radius, maxX: Math.max(particle.radius, width - particle.radius) }
            : { minX: Math.min(canvasWidth - particle.radius, canvasWidth - width + particle.radius), maxX: canvasWidth - particle.radius };
    };

    const resizeCanvas = () => {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvasWidth = bounds.width;
        canvasHeight = bounds.height;
        canvas.width = Math.round(canvasWidth * pixelRatio);
        canvas.height = Math.round(canvasHeight * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        if (!particles.length) {
            const count = 24;
            for (let index = 0; index < count; index += 1) {
                const particle = {
                    x: 0,
                    y: Math.random() * canvasHeight,
                    vx: (Math.random() - 0.5) * (sideRails ? 18 : 34),
                    vy: (Math.random() - 0.5) * (sideRails ? 36 : 34),
                    radius: sideRails ? 2.5 + Math.random() * 2 : 4 + Math.random() * 5,
                    color: index % 2,
                    rail: sideRails ? Math.floor(index / 12) : 0
                };
                const particleRange = particleBounds(particle);
                particle.x = particleRange.minX + Math.random() * (particleRange.maxX - particleRange.minX);
                particles.push(particle);
            }
        } else {
            particles.forEach((particle) => {
                const particleRange = particleBounds(particle);
                particle.x = Math.max(particleRange.minX, Math.min(particleRange.maxX, particle.x));
                particle.y = Math.min(particle.y, canvasHeight - particle.radius);
            });
        }
    };

    const drawFrame = (time, delta) => {
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        if (!reducedMotion) {
            particles.forEach((particle) => {
                const particleRange = particleBounds(particle);
                particle.x += particle.vx * delta;
                particle.y += particle.vy * delta;

                if (particle.x < particleRange.minX || particle.x > particleRange.maxX) {
                    particle.vx *= -1;
                    particle.x = Math.max(particleRange.minX, Math.min(particleRange.maxX, particle.x));
                }
                if (particle.y < particle.radius || particle.y > canvasHeight - particle.radius) {
                    particle.vy *= -1;
                    particle.y = Math.max(particle.radius, Math.min(canvasHeight - particle.radius, particle.y));
                }
            });
        }

        for (let first = 0; first < particles.length; first += 1) {
            for (let second = first + 1; second < particles.length; second += 1) {
                const start = particles[first];
                const end = particles[second];
                if (sideRails && start.rail !== end.rail) continue;

                const distance = Math.hypot(end.x - start.x, end.y - start.y);
                const reach = sideRails ? 110 : 165;
                if (distance >= reach) continue;

                const pulse = reducedMotion ? 0.75 : (Math.sin(time * 0.0015 + first * 1.7 + second * 0.83) + 1) / 2;
                if (pulse < 0.16) continue;

                const opacity = (1 - distance / reach) * ((pulse - 0.16) / 0.84) * 0.95;
                const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y);
                gradient.addColorStop(0, `${colors[start.color]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
                gradient.addColorStop(1, `${colors[end.color]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
                context.beginPath();
                context.moveTo(start.x, start.y);
                context.lineTo(end.x, end.y);
                context.strokeStyle = gradient;
                context.lineWidth = sideRails ? 1.5 : 2;
                context.stroke();
            }
        }

        particles.forEach((particle) => {
            const color = colors[particle.color];
            const glowRadius = particle.radius * (sideRails ? 2.5 : 2.8);
            const glow = context.createRadialGradient(
                particle.x - particle.radius * 0.35,
                particle.y - particle.radius * 0.35,
                1,
                particle.x,
                particle.y,
                glowRadius
            );
            glow.addColorStop(0, '#ffffff');
            glow.addColorStop(0.25, color);
            glow.addColorStop(1, `${color}00`);
            context.beginPath();
            context.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
            context.fillStyle = glow;
            context.fill();
        });
    };

    const animate = (time) => {
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.04) : 0;
        previousTime = time;
        drawFrame(time, delta);

        if (!reducedMotion) {
            window.requestAnimationFrame(animate);
        }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', () => {
    const moleculeCanvas = document.getElementById('moleculeCanvas');
    if (moleculeCanvas) {
        startMoleculeAnimation(moleculeCanvas);
    }

    const pageCanvas = document.createElement('canvas');
    pageCanvas.className = 'page-particles-canvas';
    pageCanvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pageCanvas);
    startMoleculeAnimation(pageCanvas, true);

    const searchInput = document.querySelector('[data-search]');

    if (searchInput) {
        const searchableItems = document.querySelectorAll('[data-searchable]');

        searchInput.addEventListener('input', (event) => {
            const term = event.target.value.toLowerCase().trim();

            searchableItems.forEach((item) => {
                const content = item.dataset.searchable.toLowerCase();
                const matches = !term || content.includes(term);
                item.classList.toggle('hidden', !matches);
            });
        });
    }

    const topicDetailPage = document.body.dataset.page === 'topic-detail';

    if (topicDetailPage) {
        const params = new URLSearchParams(window.location.search);
        const grade = params.get('grade') || '7';
        const topicKey = params.get('topic') || 'molekula';
        const topicsByGrade = {
            7: {
                'zat-qurylysy': 'Заттың молекулалық құрылысы',
                'molekula-atom': 'Молекулалар мен атомдар',
                diffuziya7: 'Диффузия',
                aggregat7: 'Қатты денелердің, сұйықтардың және газдардың молекулалық құрылысы'
            },
            8: {
                'broyn-diffuziya': 'Жылулық қозғалыс. Броундық қозғалыс. Диффузия',
                temperatura8: 'Температура. Температураны өлшеу тәсілдері',
                'ishki-energiya': 'Ішкі энергия. Ішкі энергияны өзгерту тәсілдері',
                'jylu-berilu': '§4. Жылуөткізгіштік, конвекция, сәуле шығару',
                'tabigat-tehnika-jylu': '§5. Табиғаттағы және техникадағы жылу берілу',
                'jylu-molsheri': '§7. Жылу мөлшері. Заттың меншікті жылусыйымдылығы',
                'otyn-energiyasy': '§8. Отын энергиясы. Отынның меншікті жану жылуы',
                'jylulyk-procester-energiyasy': '§9. Жылулық процестердегі энергияның сақталу және түрлену заңдары',
                'balqu-qatau': '§10. Қатты денелердің балқуы және қатаюы. Балқу температурасы',
                'men-shy-balqu': '§11. Меншікті балқу жылуы',
                'bulanu-kondensatsiya': '§12. Булану және конденсация. Қаныққан және қанықпаған булар',
                'qainau-bulanu-jyluy': '§13. Қайнау. Меншікті булану жылуы. Қайнау температурасының қысымға тәуелділігі',
                'termodinamikanyn-birinshi-zany': '§14. Термодинамиканың бірінші заңы. Газдың және будың жұмысы',
                'jylu-procester-qaytymsyzdygy': '§15. Жылу процестерінің қайтымсыздығы. Термодинамиканың екінші заңы',
                'jylu-qozgaltqysh-pik': '§16. Жылу қозғалтқыштарының пайдалы әсер коэффициенті (ПӘК)'
            },
            9: {
                'electrical-current': 'Электр тогы және оның сипаттамалары',
                'voltage-resistance': 'Кернеу, ток күші және электрлік кедергі',
                'magnetic-field': 'Магнит өрісі'
            },
            10: {
                mkt: '§26. Газдардың молекулалық-кинетикалық теориясының негізгі қағидалары және оның тәжірибелік дәлелдемелері',
                'molekula-ozara-aser': '§27. Молекулалардың өзара әсерлесу күштері',
                'termodinamikalyk-parametrler': '§28. Термодинамикалық жүйелер және термодинамикалық параметрлер',
                'zat-molsheri': 'Зат мөлшері. Авогадро саны. Молярлық масса',
                'absolyut-temperatura': '§29. Температура – зат бөлшектерінің жылулық қозғалыстарының орташа кинетикалық энергиясының өлшемі',
                'ideal-gas-mkt': '§30. Идеал газ. Газдардың молекулалық-кинетикалық теориясының негізгі теңдеуі',
                'ideal-gas-laws': '§31. Идеал газ күйінің теңдеуі',
                'izoprocesses-dalton': '§32. Изопроцестер. Изопроцестердің графиктері. Дальтон заңы',
                'qanyqqan-bu-aua-ylgaldyq': '§43. Қаныққан және қанықпаған бу. Ауаның ылғалдылығы',
                'fazalyq-diagrammalar': '§44. Фазалық диаграммалар. Үштік нүкте. Заттың кризистік күйі',
                'kristall-amorf': '§47. Кристалл және аморфты денелер',
                'thermodynamics-laws': 'Термодинамиканың бірінші және екінші заңдары'
            },
            11: {
                'atom-structure': 'Атом құрылысы және электрондар',
                'nuclear-radioactivity': 'Ядро және радиоактивтілік',
                'quantum-physics': 'Кванттық физиканың негізгі идеялары'
            }
        };

        const topicMap = topicsByGrade[grade] || topicsByGrade[7];
        const selectedTopic = topicMap[topicKey] || Object.values(topicMap)[0];
        const titleNode = document.getElementById('topicDetailTitle');
        const gradeLabel = document.getElementById('topicGradeLabel');
        const backLink = document.getElementById('topicBackLink');

        if (titleNode) {
            titleNode.textContent = selectedTopic || Object.values(topicMap)[0];
        }
        if (gradeLabel) {
            gradeLabel.textContent = `${grade}-сынып`;
        }
        if (backLink) {
            backLink.href = 'grades.html';
            backLink.textContent = '← Сыныптар мен тақырыптарға қайту';
        }

        const labsByGrade = {
            7: {
                'zat-qurylysy': {
                    title: 'Заттың молекулалық құрылысын бақылау',
                    intro: 'Бөлшектердің ретсіз қозғалысын және заттың микробөлшектерден тұратынын бақыла.',
                    instructions: 'Бөлшектердің қозғалысын бақыла. Жылулық қозғалысты өзгертіп, модельдің өзгерісін салыстыр.',
                    mode: 'structure', actionLabel: 'Қозғалысты өзгерту', temperatureLabel: 'Қозғалыс деңгейі'
                },
                'molekula-atom': {
                    title: 'Атомдар мен молекулалар моделі',
                    intro: 'Атомдарды молекулаға біріктіріп, жеке атомдар мен молекулалардың айырмасын бақыла.',
                    instructions: 'Қызыл және көк атомдарды қара. Атомдарды біріктіріп молекула жаса, кейін қайта ажырат.',
                    mode: 'atoms', actionLabel: 'Атомдарды біріктіру', temperatureLabel: 'Бөлшектер қозғалысы'
                },
                diffuziya7: {
                    title: 'Диффузия құбылысын зерттеу',
                    intro: 'Екі ыдыстағы көк және қызыл бөлшектердің жалғастырғыш түтік арқылы араласуын бақыла. Температура мен түтік радиусының диффузияға әсерін зертте.',
                    instructions: 'Бөлшектердің бастапқы таралуын бақыла. Пуск батырмасын басып, түтік арқылы араласуын зертте. Температура мен түтік радиусын өзгертіп, диффузия жылдамдығын салыстыр.',
                    mode: 'diffusion-study', actionLabel: 'Пуск', temperatureLabel: 'Температура'
                },
                aggregat7: {
                    title: 'Мұздың меншікті балқу жылуын анықтау',
                    intro: 'Калориметрге мұз қосып, судың температурасының өзгерісін бақыла. Өлшеу нәтижесімен мұздың меншікті балқу жылуын есепте.',
                    instructions: 'Су мен мұздың массасын енгіз. Тәжірибені іске қосып, қоспаның соңғы температурасын өлше. Энергия сақталу заңымен меншікті балқу жылуын есепте.',
                    mode: 'ice-melting', actionLabel: 'Пуск', temperatureLabel: 'Температура', initialTemperature: 2
                }
            },
            8: {
                'broyn-diffuziya': {
                    title: 'Броундық қозғалысты зерттеу',
                    intro: 'Сұйық не газ молекулаларының ретсіз соқтығысуынан броундық бөлшектің қозғалысын бақыла. Температура, тұтқырлық және бөлшек өлшемінің әсерін зертте.',
                    instructions: 'Пуск батырмасын басып, молекулалардың броундық бөлшекпен соқтығысуын бақыла. Температура, тұтқырлық және бөлшек массасын өзгертіп, қозғалыс пен траекторияны салыстыр.',
                    mode: 'brownian-study', actionLabel: 'Пуск', temperatureLabel: 'Температура'
                },
                temperatura8: {
                    title: 'Жылу алмасу процесін зерттеу',
                    intro: 'Ыстық және салқын суды калориметрде араластырып, температураның өзгеруін және жылулық тепе-теңдік орнауын бақыла.',
                    instructions: 'Ыстық және салқын судың көлемі мен бастапқы температурасын енгіз. Пуск батырмасын басып, жылу алмасуды бақыла. Өлшенген соңғы температураны есептік мәнмен салыстыр.',
                    mode: 'heat-exchange', actionLabel: 'Пуск', temperatureLabel: 'Температура'
                },
                'ishki-energiya': {
                    title: 'Отынның меншікті жану жылуын анықтау',
                    intro: 'Отын жанғанда бөлінетін энергия сұйықты қыздырып, оның ішкі энергиясын арттырады. Калориметр тәжірибесі арқылы отынның меншікті жану жылуын есепте.',
                    instructions: 'Сұйық пен отынды таңда. Отын жанғанда бөлінген энергия сұйықты қыздырады. Температура мен отын массасының өзгерісін бақылап, отынның меншікті жану жылуын есепте.',
                    mode: 'combustion', actionLabel: 'Пуск', temperatureLabel: 'Температура'
                },
                'bulanu-kondensatsiya': {
                    title: 'Булану кезіндегі салқындау және ауа ылғалдылығы',
                    intro: 'Судың булануы — сұйық күйден газ күйіне өту. Құрғақ және дымқыл термометр көрсеткіштері арқылы буланудың салқындату әсерін және ауаның салыстырмалы ылғалдылығын зертте.',
                    instructions: 'Құрғақ және дымқыл термометрлердің температурасын енгіз. Пуск батырмасын басып, дымқыл термометрдің булану әсерінен салқындауын бақыла. Психрометриялық кестені ашып, нәтижені салыстыр.',
                    mode: 'evaporation-psychrometer'
                }
            },
            10: {
                mkt: {
                    title: 'Газдың молярлық массасын анықтау',
                    intro: 'Газ баллонынан шыққан газ массасы мен қысым өзгерісін өлшеп, молярлық массаны тәжірибе арқылы анықта.',
                    mode: 'molar-mass'
                },
                'absolyut-temperatura': {
                    title: 'Газдағы изотермиялық процесті зерттеу',
                    intro: 'Температура тұрақты болғанда газ көлемі мен қысымының байланысын зерттеп, абсолют температура және молекулалардың жылулық қозғалысы өзгермейтінін бақыла.',
                    mode: 'isothermal'
                },
                'ideal-gas-mkt': {
                    title: 'Әмбебап газ тұрақтысын тәжірибе арқылы анықтау',
                    intro: 'Газдың қысым, көлем, температура және массасының өзгерісін өлшеп, идеал газдың күй теңдеуі арқылы әмбебап газ тұрақтысын анықта.',
                    mode: 'gas-constant'
                },
                'ideal-gas-laws': {
                    title: 'Идеал газ заңдары: изотермиялық процесс',
                    intro: 'Идеал газдың күй теңдеуінен изотермиялық процесс үшін Бойль–Мариотт заңы шығады: температура мен газ массасы тұрақты болғанда қысым көлемге кері пропорционал өзгереді.',
                    instructions: 'Газды таңда. Бастапқы температура, көлем мен қысымды реттеп, көлем жүгірткісін өзгертіп көр. Қысымның көлемге кері пропорционал өзгерісін, ал температура мен орташа кинетикалық энергияның тұрақты қалуын бақыла.',
                    mode: 'isothermal'
                },
                'thermodynamics-laws': {
                    title: 'Отынның меншікті жану жылуын анықтау',
                    intro: 'Отын жанғанда бөлінген энергия сұйық пен калориметрдің ішкі энергиясын арттырады. Термодинамиканың бірінші заңы бойынша энергия балансын қолданып, температура өзгерісі арқылы отынның меншікті жану жылуын анықта. Нақты тәжірибеде жылудың қоршаған ортаға таралуы екінші заңға сай өлшеу нәтижесіне әсер етуі мүмкін.',
                    instructions: 'Сұйық пен отынды таңда. «Пуск» батырмасын басып, температураның өзгеруін бақыла. Отынның жану энергиясын Qотын = Qсұйық + Qкал энергия балансымен салыстырып, өлшенген Δt мен жанған отын массасы арқылы q-ды анықта. Жылудың қоршаған ортаға таралуын ескер.',
                    mode: 'combustion'
                },
                'qanyqqan-bu-aua-ylgaldyq': {
                    title: 'Қаныққан және қанықпаған буды зерттеу',
                    intro: 'Ауадағы су буының күйін және салыстырмалы ылғалдылықты зертте. Құрғақ және дымқыл термометр көрсеткіштері бойынша ауаның ылғалдылығын анықта.',
                    instructions: 'Құрғақ және дымқыл термометрлердің температурасын енгіз. «Пуск» батырмасын басып, көрсеткіштер айырмасын бақыла. Психрометриялық кестені ашып, ауаның салыстырмалы ылғалдылығын анықта.',
                    mode: 'ice-melting', initialTemperature: 2
                }
            }
        };

        const moleculeLabEntry = document.getElementById('moleculeLabEntry');
        const labConfig = labsByGrade[grade] && labsByGrade[grade][topicKey];
        if (moleculeLabEntry && labConfig) {
            moleculeLabEntry.classList.remove('hidden');
            initializeMoleculeLab(labConfig);

        }

        const tabButtons = document.querySelectorAll('.detail-tab');
        const panels = document.querySelectorAll('.detail-panel');

        const setDetailTab = (tabName) => {
            tabButtons.forEach((button) => {
                button.classList.toggle('active', button.dataset.tab === tabName);
            });

            panels.forEach((panel) => {
                panel.classList.toggle('active', panel.dataset.panel === tabName);
            });
        };

        const presentationViewer = document.getElementById('presentationViewer');
        const taskImageViewer = document.getElementById('taskImageViewer');
        if (grade === '8' && topicKey === 'broyn-diffuziya' && taskImageViewer) {
            const taskImages = [
                'images/task-8-thermal-motion-01.jpeg',
                'images/task-8-thermal-motion-02.jpeg'
            ];
            const taskSlide = document.getElementById('taskImageSlide');
            const taskCounter = document.getElementById('taskImageCounter');
            const taskPreviousButton = document.getElementById('taskImagePrevious');
            const taskNextButton = document.getElementById('taskImageNext');
            const taskFullscreenButton = document.getElementById('taskImageFullscreen');
            let currentTaskImage = 0;

            const updateTaskImage = () => {
                taskSlide.src = taskImages[currentTaskImage];
                taskSlide.alt = `Жылулық қозғалыс тақырыбының тапсырмасы, ${currentTaskImage + 1}-сурет`;
                taskCounter.textContent = `${currentTaskImage + 1} / ${taskImages.length}`;
            };

            taskPreviousButton.addEventListener('click', () => {
                currentTaskImage = (currentTaskImage - 1 + taskImages.length) % taskImages.length;
                updateTaskImage();
            });

            taskNextButton.addEventListener('click', () => {
                currentTaskImage = (currentTaskImage + 1) % taskImages.length;
                updateTaskImage();
            });

            const updateTaskFullscreenButton = () => {
                const isFullscreen = taskImageViewer.matches(':fullscreen');
                taskFullscreenButton.classList.toggle('is-fullscreen', isFullscreen);
                taskFullscreenButton.setAttribute(
                    'aria-label',
                    isFullscreen ? 'Толық экран режимінен шығу' : 'Тапсырмаларды толық экранға ашу'
                );
                taskFullscreenButton.title = isFullscreen ? 'Толық экран режимінен шығу' : 'Тапсырмаларды толық экранға ашу';
            };

            taskFullscreenButton.addEventListener('click', async () => {
                try {
                    if (taskImageViewer.matches(':fullscreen')) {
                        await document.exitFullscreen();
                    } else {
                        await taskImageViewer.requestFullscreen();
                    }
                } catch (error) {
                    console.error('Тапсырмаларды толық экран режиміне ауыстыру мүмкін болмады.', error);
                }
            });

            document.addEventListener('fullscreenchange', updateTaskFullscreenButton);
            taskImageViewer.classList.remove('hidden');
            updateTaskImage();
            updateTaskFullscreenButton();
        }

        const presentationsByTopic = {
            'zat-qurylysy': {
                title: 'Заттың молекулалық құрылысы',
                folder: 'presentation-zat-qurylysy',
                slideCount: 11
            },
            'molekula-atom': {
                title: 'Молекулалар мен атомдар',
                folder: 'presentation-molecules-atoms',
                slideCount: 11
            }
        };
        const presentation = grade === '7' ? presentationsByTopic[topicKey] : null;
        if (presentation && presentationViewer) {
            const slideImage = document.getElementById('presentationSlide');
            presentationViewer.setAttribute('aria-label', `${presentation.title} презентациясы`);
            const slideCounter = document.getElementById('presentationCounter');
            const previousButton = document.getElementById('presentationPrevious');
            const nextButton = document.getElementById('presentationNext');
            const zoomOutButton = document.getElementById('presentationZoomOut');
            const zoomInButton = document.getElementById('presentationZoomIn');
            const zoomResetButton = document.getElementById('presentationZoomReset');
            const fullscreenButton = document.getElementById('presentationFullscreen');
            const zoomLevel = document.getElementById('presentationZoomLevel');
            const slideCount = presentation.slideCount;
            let currentSlide = 1;
            let zoom = 1;

            const updateSlide = () => {
                const slideNumber = String(currentSlide).padStart(2, '0');
                slideImage.src = `images/${presentation.folder}/slide-${slideNumber}.png`;
                slideImage.alt = `${presentation.title} презентациясы, ${currentSlide}-слайд`;
                slideCounter.textContent = `${currentSlide} / ${slideCount}`;
                previousButton.disabled = currentSlide === 1;
                nextButton.disabled = currentSlide === slideCount;
            };

            const updateZoom = () => {
                slideImage.style.setProperty('--slide-zoom', zoom);
                zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
                zoomOutButton.disabled = zoom <= 0.6;
                zoomInButton.disabled = zoom >= 2;
            };

            previousButton.addEventListener('click', () => {
                if (currentSlide > 1) {
                    currentSlide -= 1;
                    updateSlide();
                }
            });

            nextButton.addEventListener('click', () => {
                if (currentSlide < slideCount) {
                    currentSlide += 1;
                    updateSlide();
                }
            });

            zoomOutButton.addEventListener('click', () => {
                zoom = Math.max(0.6, Math.round((zoom - 0.2) * 10) / 10);
                updateZoom();
            });

            zoomInButton.addEventListener('click', () => {
                zoom = Math.min(2, Math.round((zoom + 0.2) * 10) / 10);
                updateZoom();
            });

            zoomResetButton.addEventListener('click', () => {
                zoom = 1;
                updateZoom();
            });

            const updateFullscreenButton = () => {
                const isFullscreen = presentationViewer.matches(':fullscreen');
                fullscreenButton.classList.toggle('is-fullscreen', isFullscreen);
                fullscreenButton.setAttribute(
                    'aria-label',
                    isFullscreen ? 'Толық экран режимінен шығу' : 'Презентацияны толық экранға ашу'
                );
                fullscreenButton.title = isFullscreen ? 'Толық экран режимінен шығу' : 'Презентацияны толық экранға ашу';
            };

            fullscreenButton.addEventListener('click', async () => {
                try {
                    if (presentationViewer.matches(':fullscreen')) {
                        await document.exitFullscreen();
                    } else {
                        await presentationViewer.requestFullscreen();
                    }
                } catch (error) {
                    console.error('Презентацияның толық экран режимін өзгерту мүмкін болмады.', error);
                }
            });

            document.addEventListener('fullscreenchange', updateFullscreenButton);
            presentationViewer.classList.remove('hidden');
            updateSlide();
            updateZoom();
            updateFullscreenButton();
        }

        tabButtons.forEach((button) => {
            button.addEventListener('click', () => setDetailTab(button.dataset.tab));
        });

        setDetailTab('presentation');
    }

    const modal = document.getElementById('topicModal');
    if (!modal) return;

    const modalTitle = document.getElementById('modalTitle');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const modalPanels = document.querySelectorAll('.modal-panel');

    function setActiveTab(tabName) {
        tabButtons.forEach((button) => {
            const active = button.dataset.tab === tabName;
            button.classList.toggle('active', active);
        });

        modalPanels.forEach((panel) => {
            const active = panel.dataset.panel === tabName;
            panel.classList.toggle('active', active);
        });
    }

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => setActiveTab(button.dataset.tab));
    });

    document.querySelectorAll('.close-modal').forEach((button) => {
        button.addEventListener('click', () => {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
        });
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
        }
    });

    document.querySelectorAll('.topic-box').forEach((box) => {
        box.addEventListener('click', (event) => {
            if (event.target.closest('.inline-answer')) {
                return;
            }

            modalTitle.textContent = box.dataset.title;
            const tabMap = {};
            box.querySelectorAll('.topic-panel-content').forEach((panel) => {
                tabMap[panel.dataset.tab] = panel.innerHTML;
            });

            modalPanels.forEach((panel) => {
                panel.innerHTML = tabMap[panel.dataset.panel] || '<p>Материал әзірленуде.</p>';
            });

            setActiveTab('presentation');
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
        });
    });

    document.querySelectorAll('.inline-answer').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const answerBox = button.nextElementSibling;
            answerBox.classList.toggle('hidden');
        });
    });

    document.querySelectorAll('.answer-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const answer = button.nextElementSibling;
            if (!answer) return;

            const hidden = answer.classList.toggle('hidden');
            button.textContent = hidden ? 'Жауабы' : 'Жауапты жасыру';
        });
    });
});

function initializeMaxwellLab({ overlay, openButton, closeButton, config }) {
    const labWindow = overlay.querySelector('.lab-window');
    const labTitle = document.getElementById('labTitle');
    const labGradeLabel = document.getElementById('labGradeLabel');
    const controls = document.getElementById('maxwellLabControls');
    const stage = document.getElementById('maxwellStage');
    const chart = document.getElementById('maxwellChart');
    const chartContext = chart.getContext('2d');
    const gasSelect = document.getElementById('maxwellGas');
    const massInput = document.getElementById('maxwellMass');
    const temperatureInput = document.getElementById('maxwellTemperature');
    const countInput = document.getElementById('maxwellCount');
    const dotSizeInput = document.getElementById('maxwellDotSize');
    const massValue = document.getElementById('maxwellMassValue');
    const temperatureValue = document.getElementById('maxwellTemperatureValue');
    const countValue = document.getElementById('maxwellCountValue');
    const dotSizeValue = document.getElementById('maxwellDotSizeValue');
    const mostProbableValue = document.getElementById('maxwellMostProbable');
    const averageValue = document.getElementById('maxwellAverage');
    const rmsValue = document.getElementById('maxwellRms');
    const resetButton = document.getElementById('maxwellReset');
    const boltzmannConstant = 1.380649e-23;
    const atomicMassUnit = 1.6605390666e-27;
    const avogadroConstant = 6.02214076e23;
    const moleculeColors = ['#fa6277', '#48a7ff', '#bd79ff', '#ffc45c'];
    let open = false;

    labWindow.classList.add('is-maxwell-lab');
    labTitle.textContent = config.title;
    labGradeLabel.textContent = `Виртуалды зертхана • ${new URLSearchParams(window.location.search).get('grade') || '10'}-сынып`;
    controls.classList.remove('hidden');
    stage.classList.remove('hidden');

    const selectedMoleculeMass = () => Number(massInput.value) * atomicMassUnit;

    const maxwellDensity = (speed, temperature, mass) => {
        const ratio = mass / (2 * Math.PI * boltzmannConstant * temperature);
        return 4 * Math.PI * ratio ** 1.5 * speed ** 2
            * Math.exp(-mass * speed ** 2 / (2 * boltzmannConstant * temperature));
    };

    const gaussianSample = () => {
        const first = Math.max(Number.EPSILON, Math.random());
        const second = Math.random();
        return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
    };

    const drawChart = () => {
        const bounds = chart.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        chart.width = Math.round(bounds.width * pixelRatio);
        chart.height = Math.round(bounds.height * pixelRatio);
        chartContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const width = bounds.width;
        const height = bounds.height;
        const margin = { top: 24, right: 20, bottom: 56, left: 66 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        if (plotWidth <= 0 || plotHeight <= 0) return;

        const temperature = Number(temperatureInput.value);
        const mass = selectedMoleculeMass();
        const moleculeCount = Number(countInput.value);
        const dotRadius = Number(dotSizeInput.value);
        const mostProbable = Math.sqrt(2 * boltzmannConstant * temperature / mass);
        const average = Math.sqrt(8 * boltzmannConstant * temperature / (Math.PI * mass));
        const rms = Math.sqrt(3 * boltzmannConstant * temperature / mass);
        const maxSpeed = mostProbable * 3.2;
        const peakDensity = maxwellDensity(mostProbable, temperature, mass);
        const maxDensity = peakDensity * 1.2;
        const binCount = 32;
        const binWidth = maxSpeed / binCount;
        const bins = Array.from({ length: binCount }, () => []);
        const thermalScale = Math.sqrt(boltzmannConstant * temperature / mass);

        for (let index = 0; index < moleculeCount; index += 1) {
            const speed = thermalScale * Math.hypot(gaussianSample(), gaussianSample(), gaussianSample());
            const binIndex = Math.floor(speed / binWidth);
            if (binIndex >= 0 && binIndex < binCount) bins[binIndex].push(speed);
        }

        const xPosition = (speed) => margin.left + speed / maxSpeed * plotWidth;
        const yPosition = (density) => margin.top + plotHeight * (1 - density / maxDensity);
        const formatMass = (massInKg) => `${(massInKg / 1e-27).toFixed(2)} × 10⁻²⁷`;

        massValue.textContent = `${massInput.value} u · ${formatMass(mass)} кг`;
        temperatureValue.textContent = `${temperature} K`;
        countValue.textContent = `${moleculeCount}`;
        dotSizeValue.textContent = `${dotRadius}`;
        mostProbableValue.textContent = `${mostProbable.toFixed(1)} м/с`;
        averageValue.textContent = `${average.toFixed(1)} м/с`;
        rmsValue.textContent = `${rms.toFixed(1)} м/с`;

        chartContext.clearRect(0, 0, width, height);
        chartContext.fillStyle = '#101b2c';
        chartContext.fillRect(0, 0, width, height);
        chartContext.font = '12px Segoe UI, Arial, sans-serif';
        chartContext.textAlign = 'right';
        chartContext.textBaseline = 'middle';

        for (let tick = 0; tick <= 4; tick += 1) {
            const density = maxDensity * tick / 4;
            const y = yPosition(density);
            chartContext.strokeStyle = 'rgba(190, 211, 240, 0.14)';
            chartContext.lineWidth = 1;
            chartContext.beginPath();
            chartContext.moveTo(margin.left, y);
            chartContext.lineTo(width - margin.right, y);
            chartContext.stroke();
            chartContext.fillStyle = '#bdcbe0';
            chartContext.fillText(density.toExponential(1), margin.left - 8, y);
        }

        const xTicks = 5;
        chartContext.textAlign = 'center';
        chartContext.textBaseline = 'top';
        for (let tick = 0; tick <= xTicks; tick += 1) {
            const speed = maxSpeed * tick / xTicks;
            const x = xPosition(speed);
            chartContext.strokeStyle = 'rgba(190, 211, 240, 0.12)';
            chartContext.beginPath();
            chartContext.moveTo(x, margin.top);
            chartContext.lineTo(x, margin.top + plotHeight);
            chartContext.stroke();
            chartContext.fillStyle = '#bdcbe0';
            chartContext.fillText(Math.round(speed).toLocaleString('kk-KZ'), x, margin.top + plotHeight + 9);
        }

        chartContext.strokeStyle = 'rgba(218, 231, 250, 0.7)';
        chartContext.lineWidth = 1.5;
        chartContext.beginPath();
        chartContext.moveTo(margin.left, margin.top);
        chartContext.lineTo(margin.left, margin.top + plotHeight);
        chartContext.lineTo(width - margin.right, margin.top + plotHeight);
        chartContext.stroke();

        chartContext.save();
        chartContext.translate(16, margin.top + plotHeight / 2);
        chartContext.rotate(-Math.PI / 2);
        chartContext.fillStyle = '#e0e9f7';
        chartContext.textAlign = 'center';
        chartContext.textBaseline = 'middle';
        chartContext.fillText('f(v), с/м', 0, 0);
        chartContext.restore();
        chartContext.fillStyle = '#e0e9f7';
        chartContext.textAlign = 'center';
        chartContext.textBaseline = 'bottom';
        chartContext.fillText('Жылдамдық, м/с', margin.left + plotWidth / 2, height - 4);

        chartContext.beginPath();
        for (let index = 0; index <= 180; index += 1) {
            const speed = maxSpeed * index / 180;
            const x = xPosition(speed);
            const y = yPosition(maxwellDensity(speed, temperature, mass));
            if (index === 0) chartContext.moveTo(x, y);
            else chartContext.lineTo(x, y);
        }
        chartContext.strokeStyle = '#72aaff';
        chartContext.lineWidth = 3;
        chartContext.stroke();

        bins.forEach((bin, binIndex) => {
            const density = bin.length / (moleculeCount * binWidth);
            const stackHeight = density / maxDensity * plotHeight;
            const dotStep = dotRadius * 2.45;
            const visibleCount = Math.min(bin.length, Math.floor(stackHeight / dotStep) + 1);
            const x = xPosition((binIndex + 0.5) * binWidth);
            for (let dot = 0; dot < visibleCount; dot += 1) {
                const y = margin.top + plotHeight - dot * dotStep - dotRadius;
                chartContext.beginPath();
                chartContext.arc(x, y, dotRadius, 0, Math.PI * 2);
                chartContext.fillStyle = moleculeColors[(binIndex + dot) % moleculeColors.length];
                chartContext.fill();
                chartContext.strokeStyle = 'rgba(12, 24, 42, 0.75)';
                chartContext.lineWidth = 1;
                chartContext.stroke();
            }
        });
    };

    const handleGasChange = () => {
        const selectedOption = gasSelect.selectedOptions[0];
        if (selectedOption.dataset.mass) massInput.value = selectedOption.dataset.mass;
        drawChart();
    };

    gasSelect.addEventListener('change', handleGasChange);
    massInput.addEventListener('input', () => {
        const matchingGas = Array.from(gasSelect.options).find((option) => option.dataset.mass === massInput.value);
        gasSelect.value = matchingGas ? matchingGas.value : 'custom';
        drawChart();
    });
    [temperatureInput, countInput, dotSizeInput].forEach((input) => {
        input.addEventListener('input', drawChart);
    });
    resetButton.addEventListener('click', () => {
        gasSelect.value = 'H₂';
        massInput.value = '2';
        temperatureInput.value = '300';
        countInput.value = '300';
        dotSizeInput.value = '3';
        drawChart();
    });
    window.addEventListener('resize', drawChart);

    const openLab = async () => {
        open = true;
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        drawChart();
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch {
                overlay.classList.add('is-open');
            }
        }
    };

    const closeLab = async () => {
        open = false;
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
        }
    };

    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && open && !document.fullscreenElement) closeLab();
    });
    drawChart();
}

function initializeGasConstantLab(elements) {
    const { overlay, canvas, openButton, closeButton, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('gasConstantLabControls');
    const standardControls = document.getElementById('standardLabControls');
    const legend = document.getElementById('labLegend');
    const stageCanvas = document.getElementById('gasConstantCanvas');
    const ctx = stageCanvas.getContext('2d');
    const gasSelect = document.getElementById('gasConstantGas');
    const fields = {
        temperature: document.getElementById('gasConstantTemperature'),
        volume: document.getElementById('gasConstantVolume'),
        initialMass: document.getElementById('gasConstantInitialMass'),
        finalMass: document.getElementById('gasConstantFinalMass'),
        initialPressure: document.getElementById('gasConstantInitialPressure'),
        finalPressure: document.getElementById('gasConstantFinalPressure')
    };
    const inputs = [gasSelect, ...Object.values(fields)];
    const startButton = document.getElementById('gasConstantStart');
    const pauseButton = document.getElementById('gasConstantPause');
    const resetButton = document.getElementById('gasConstantReset');
    const status = document.getElementById('gasConstantStatus');
    const result = document.getElementById('gasConstantResult');
    const comparison = document.getElementById('gasConstantComparison');
    const gasConstant = 8.314;
    const avogadroConstant = 6.02214076e23;
    const duration = 5000;
    let width = 0;
    let height = 0;
    let progress = 0;
    let running = false;
    let paused = false;
    let elapsed = 0;
    let startedAt = 0;
    let frameId = 0;
    let completionTimeout = 0;
    let previousFrame = 0;
    let bubbles = [];

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = 'Виртуалды зертхана • 10-сынып';
    canvas.classList.add('hidden');
    document.getElementById('molarMassCanvas').classList.add('hidden');
    stageCanvas.classList.remove('hidden');
    stageCanvas.setAttribute('aria-label', 'Газ баллоны, термометр және манометр көрсетілген тәжірибе');
    standardControls.classList.add('hidden');
    document.getElementById('molarMassLabControls').classList.add('hidden');
    controls.classList.remove('hidden');
    legend.classList.add('hidden');
    labWindow.classList.add('is-molar-mass-lab');

    const values = () => Object.fromEntries(
        Object.entries(fields).map(([name, input]) => [name, Number(input.value)])
    );
    const molarMass = () => Number(gasSelect.selectedOptions[0].dataset.molarMass);
    const updateFinalMass = () => {
        const current = values();
        const temperature = current.temperature + 273.15;
        if (temperature <= 0 || current.initialPressure <= current.finalPressure || current.volume <= 0) return;
        const massOut = molarMass() * (current.initialPressure - current.finalPressure)
            * current.volume / (gasConstant * temperature);
        fields.finalMass.value = Math.max(0, current.initialMass - massOut).toFixed(7);
    };
    const validate = () => {
        inputs.forEach((input) => input.setCustomValidity(''));
        for (const input of inputs) {
            if (!input.reportValidity()) return false;
        }
        const current = values();
        if (current.temperature <= -273.15) {
            fields.temperature.setCustomValidity('Температура абсолют нөлден жоғары болуы керек.');
            fields.temperature.reportValidity();
            return false;
        }
        if (current.initialMass <= current.finalMass) {
            fields.finalMass.setCustomValidity('Газ шыққаннан кейінгі масса бастапқы массадан аз болуы керек.');
            fields.finalMass.reportValidity();
            return false;
        }
        if (current.initialPressure <= current.finalPressure) {
            fields.finalPressure.setCustomValidity('Газ шыққаннан кейінгі қысым бастапқы қысымнан аз болуы керек.');
            fields.finalPressure.reportValidity();
            return false;
        }
        return true;
    };
    const calculate = () => {
        const current = values();
        const temperature = current.temperature + 273.15;
        const amount = (current.initialMass - current.finalMass) / molarMass();
        const measuredR = (current.initialPressure - current.finalPressure) * current.volume / (amount * temperature);
        return { measuredR, amount, particleCount: amount * avogadroConstant };
    };
    const showResult = () => {
        const measured = calculate();
        const deviation = Math.abs(measured.measuredR - gasConstant) / gasConstant * 100;
        result.textContent = `R = ${measured.measuredR.toFixed(2)} Дж/(моль·К) · n = ${measured.amount.toExponential(2)} моль`;
        comparison.textContent = `N = ${measured.particleCount.toExponential(2)} бөлшек · анықтамалық R = 8,314 Дж/(моль·К) · ауытқу ${deviation.toFixed(1)}%`;
    };
    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        inputs.forEach((input) => { input.disabled = running; });
    };
    const finishExperiment = () => {
        if (!running) return;
        progress = 1;
        running = false;
        paused = false;
        window.clearTimeout(completionTimeout);
        status.textContent = 'Тәжірибе аяқталды. Есептелген мәнді анықтамалық тұрақтымен салыстыр.';
        showResult();
        updateControls();
        drawScene();
    };
    const scheduleCompletion = () => {
        window.clearTimeout(completionTimeout);
        completionTimeout = window.setTimeout(finishExperiment, Math.max(0, duration - elapsed));
    };
    const reset = () => {
        window.clearTimeout(completionTimeout);
        running = false;
        paused = false;
        elapsed = 0;
        progress = 0;
        gasSelect.value = 'air';
        fields.temperature.value = '20';
        fields.volume.value = '0.003';
        fields.initialMass.value = '0.05';
        fields.initialPressure.value = '101000';
        fields.finalPressure.value = '96000';
        updateFinalMass();
        inputs.forEach((input) => input.setCustomValidity(''));
        status.textContent = 'Газды таңдап, Пуск батырмасын бас.';
        result.textContent = 'R = — · n = —';
        comparison.textContent = 'N = — · анықтамалық R = 8,31 Дж/(моль·К)';
        updateControls();
        drawScene();
    };
    const resizeCanvas = () => {
        const bounds = stageCanvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        stageCanvas.width = Math.round(width * pixelRatio);
        stageCanvas.height = Math.round(height * pixelRatio);
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        bubbles = Array.from({ length: 34 }, () => ({
            x: Math.random(),
            y: 0.43 + Math.random() * 0.34,
            radius: 2 + Math.random() * 4,
            speed: 0.01 + Math.random() * 0.025
        }));
        drawScene();
    };
    const drawScene = () => {
        if (!width || !height) return;
        const current = values();
        const scale = Math.min(width / 900, height / 600);
        const gaugeRadius = Math.max(58, Math.min(110, width * 0.12, height * 0.2));
        const pressure = current.initialPressure - (current.initialPressure - current.finalPressure) * progress;
        const pressureRatio = Math.min(1, Math.max(0, pressure / Math.max(1, current.initialPressure)));
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0b1a31';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(125, 165, 219, 0.09)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 38) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 38) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        const thermometerX = width * 0.11;
        const thermometerY = height * 0.2;
        const thermometerHeight = Math.min(height * 0.6, 370);
        ctx.fillStyle = '#d5e5e9';
        ctx.strokeStyle = '#708f90';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(thermometerX, thermometerY, 62, thermometerHeight, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#a92943';
        ctx.fillRect(thermometerX + 28, thermometerY + 28, 7, thermometerHeight - 60);
        ctx.beginPath(); ctx.arc(thermometerX + 31.5, thermometerY + thermometerHeight - 28, 17, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#243a4b';
        ctx.font = `600 ${Math.max(12, 14 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d8e6ff';
        ctx.fillText(`${current.temperature} °C`, thermometerX + 31, thermometerY + thermometerHeight + 28);

        const tankX = width * 0.3;
        const tankY = height * 0.3;
        const tankWidth = Math.max(90, Math.min(155, width * 0.17));
        const tankHeight = Math.min(height * 0.48, 260);
        const tankGradient = ctx.createLinearGradient(tankX, 0, tankX + tankWidth, 0);
        tankGradient.addColorStop(0, '#315979');
        tankGradient.addColorStop(0.18, '#b7d8e6');
        tankGradient.addColorStop(0.47, '#517c9d');
        tankGradient.addColorStop(0.82, '#c6e1e9');
        tankGradient.addColorStop(1, '#274963');
        ctx.fillStyle = tankGradient;
        ctx.beginPath(); ctx.roundRect(tankX, tankY, tankWidth, tankHeight, [22, 22, 16, 16]); ctx.fill();
        ctx.strokeStyle = '#8bc6dc';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(17, 40, 67, 0.7)';
        ctx.fillRect(tankX + 14, tankY + 18, tankWidth - 28, tankHeight - 36);
        ctx.save();
        ctx.beginPath(); ctx.rect(tankX + 15, tankY + 18, tankWidth - 30, tankHeight - 36); ctx.clip();
        bubbles.forEach((bubble, index) => {
            if (index < Math.floor(progress * bubbles.length * 0.62)) return;
            const bx = tankX + 22 + bubble.x * (tankWidth - 44);
            const by = tankY + 24 + bubble.y * (tankHeight - 48);
            const glow = ctx.createRadialGradient(bx - bubble.radius * 0.3, by - bubble.radius * 0.3, 0, bx, by, bubble.radius * 2.2);
            glow.addColorStop(0, '#fff');
            glow.addColorStop(0.35, '#6dd9ff');
            glow.addColorStop(1, 'rgba(54, 169, 255, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(bx, by, bubble.radius * 2.2, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
        ctx.fillStyle = '#c9e7f2';
        ctx.font = `600 ${Math.max(14, 17 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`Газ баллоны · ${gasSelect.options[gasSelect.selectedIndex].text.split(' (')[0]}`, tankX + tankWidth / 2, tankY + tankHeight + 28);

        const gaugeX = Math.min(width - gaugeRadius - 20, Math.max(gaugeRadius + 20, width * 0.76));
        const gaugeY = Math.min(height - gaugeRadius - 80, Math.max(gaugeRadius + 55, height * 0.4));
        const gaugeGradient = ctx.createRadialGradient(gaugeX - gaugeRadius * 0.35, gaugeY - gaugeRadius * 0.42, 4, gaugeX, gaugeY, gaugeRadius);
        gaugeGradient.addColorStop(0, '#f4fbff');
        gaugeGradient.addColorStop(0.75, '#bcd5df');
        gaugeGradient.addColorStop(1, '#416d83');
        ctx.fillStyle = '#2c7189';
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, gaugeRadius + 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = gaugeGradient;
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, gaugeRadius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#406173';
        ctx.lineWidth = 2;
        for (let tick = 0; tick <= 20; tick += 1) {
            const angle = Math.PI * (0.78 + tick * 1.44 / 20);
            const inner = gaugeRadius * (tick % 5 === 0 ? 0.78 : 0.84);
            ctx.beginPath();
            ctx.moveTo(gaugeX + Math.cos(angle) * inner, gaugeY + Math.sin(angle) * inner);
            ctx.lineTo(gaugeX + Math.cos(angle) * gaugeRadius * 0.91, gaugeY + Math.sin(angle) * gaugeRadius * 0.91);
            ctx.stroke();
        }
        ctx.fillStyle = '#355b70';
        ctx.font = `600 ${Math.max(12, 14 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`${Math.round(pressure / 1000)} кПа`, gaugeX, gaugeY + gaugeRadius * 0.45);
        const needleAngle = Math.PI * (0.78 + (1 - pressureRatio) * 1.44);
        ctx.strokeStyle = '#bd2530';
        ctx.lineWidth = Math.max(3, 5 * scale);
        ctx.beginPath(); ctx.moveTo(gaugeX, gaugeY);
        ctx.lineTo(gaugeX + Math.cos(needleAngle) * gaugeRadius * 0.69, gaugeY + Math.sin(needleAngle) * gaugeRadius * 0.69);
        ctx.stroke();
        ctx.fillStyle = '#bd2530';
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, Math.max(5, 7 * scale), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8e6ff';
        ctx.font = `600 ${Math.max(13, 16 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`Қысым: ${Math.round(pressure).toLocaleString('kk-KZ')} Па`, gaugeX, gaugeY + gaugeRadius + 34);
        ctx.fillStyle = '#ffd2da';
        ctx.font = `600 ${Math.max(15, 20 * scale)}px Segoe UI, Arial, sans-serif`;
        const sceneStatus = progress === 1
            ? 'Тәжірибе аяқталды'
            : running ? (paused ? 'Тәжірибе тоқтатылды' : 'Газ шығару жүріп жатыр…')
                : 'Тәжірибені бастауға дайын';
        ctx.fillText(sceneStatus, width / 2, height * 0.1);
        if (progress === 1) {
            ctx.fillStyle = '#b7f4ce';
            ctx.fillText(`Өлшенген газ массасы: ${(current.initialMass - current.finalMass).toFixed(6)} кг`, width / 2, height - 20);
        }
    };
    const animate = (time) => {
        if (running && !paused) {
            elapsed = time - startedAt;
            progress = Math.min(1, elapsed / duration);
            if (progress >= 1) finishExperiment();
        }
        if (!paused) {
            const delta = previousFrame ? Math.min((time - previousFrame) / 1000, 0.05) : 0;
            bubbles.forEach((bubble) => {
                bubble.y -= bubble.speed * delta;
                if (bubble.y < 0) bubble.y = 1;
            });
        }
        previousFrame = time;
        drawScene();
        if (overlay.classList.contains('is-open')) frameId = window.requestAnimationFrame(animate);
    };
    const openLab = async () => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(animate);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };
    const closeLab = async () => {
        window.cancelAnimationFrame(frameId);
        if (running && !paused) {
            elapsed = performance.now() - startedAt;
            paused = true;
            window.clearTimeout(completionTimeout);
            updateControls();
        }
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };

    startButton.addEventListener('click', () => {
        if (!validate()) return;
        if (paused) {
            paused = false;
            startedAt = performance.now() - elapsed;
            scheduleCompletion();
            status.textContent = 'Тәжірибе жалғасуда…';
        } else {
            progress = 0;
            elapsed = 0;
            startedAt = performance.now();
            status.textContent = 'Газ баллонынан газ шығуда. Манометр көрсеткішін бақыла.';
            result.textContent = 'R = есептелуде · n = есептелуде';
            comparison.textContent = 'Қысым мен массаның өзгерісі өлшенуде.';
            scheduleCompletion();
        }
        running = true;
        paused = false;
        updateControls();
        drawScene();
    });
    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            paused = false;
            startedAt = performance.now() - elapsed;
            scheduleCompletion();
            status.textContent = 'Тәжірибе жалғасуда…';
        } else {
            elapsed = performance.now() - startedAt;
            paused = true;
            window.clearTimeout(completionTimeout);
            status.textContent = 'Тәжірибе уақытша тоқтатылды. Жалғастыру үшін батырманы бас.';
        }
        updateControls();
        drawScene();
    });
    resetButton.addEventListener('click', reset);
    gasSelect.addEventListener('change', () => {
        updateFinalMass();
        status.textContent = 'Газ таңдалды. Тәжірибені бастауға дайын.';
        result.textContent = 'R = — · n = —';
        comparison.textContent = 'N = — · анықтамалық R = 8,31 Дж/(моль·К)';
        drawScene();
    });
    inputs.forEach((input) => input.addEventListener('input', () => {
        input.setCustomValidity('');
        if (!running) {
            status.textContent = 'Параметрлер жаңартылды. Өлшеуді баста.';
            result.textContent = 'R = — · n = —';
            comparison.textContent = 'N = — · анықтамалық R = 8,31 Дж/(моль·К)';
            drawScene();
        }
    }));
    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('is-open') && !document.fullscreenElement) closeLab();
    });
    window.addEventListener('resize', resizeCanvas);
    reset();
}

function initializeIsothermalLab(elements) {
    const { overlay, canvas, openButton, closeButton, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('isothermalLabControls');
    const stageCanvas = document.getElementById('isothermalCanvas');
    const ctx = stageCanvas.getContext('2d');
    const gasSelect = document.getElementById('isothermalGas');
    const temperatureInput = document.getElementById('isothermalTemperature');
    const initialVolumeInput = document.getElementById('isothermalInitialVolume');
    const initialPressureInput = document.getElementById('isothermalInitialPressure');
    const volumeInput = document.getElementById('isothermalVolume');
    const volumeValue = document.getElementById('isothermalVolumeValue');
    const temperatureState = document.getElementById('isothermalTemperatureState');
    const massState = document.getElementById('isothermalMassState');
    const pressureState = document.getElementById('isothermalPressureState');
    const status = document.getElementById('isothermalStatus');
    const result = document.getElementById('isothermalResult');
    const startButton = document.getElementById('isothermalStart');
    const pauseButton = document.getElementById('isothermalPause');
    const stopButton = document.getElementById('isothermalStop');
    const initialInputs = [gasSelect, temperatureInput, initialVolumeInput, initialPressureInput];
    const gasConstant = 8.314;
    const boltzmannConstant = 1.380649e-23;
    let width = 0;
    let height = 0;
    let running = false;
    let paused = false;
    let elapsed = 0;
    let startedAt = 0;
    let frameId = 0;
    let previousFrame = 0;
    let particles = [];

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = 'Виртуалды зертхана • 10-сынып';
    canvas.classList.add('hidden');
    document.getElementById('molarMassCanvas').classList.add('hidden');
    document.getElementById('gasConstantCanvas').classList.add('hidden');
    stageCanvas.classList.remove('hidden');
    stageCanvas.setAttribute('aria-label', 'Изотермиялық процестегі термометр, манометр және газ поршені');
    document.getElementById('standardLabControls').classList.add('hidden');
    document.getElementById('molarMassLabControls').classList.add('hidden');
    document.getElementById('gasConstantLabControls').classList.add('hidden');
    controls.classList.remove('hidden');
    document.getElementById('labLegend').classList.add('hidden');
    labWindow.classList.add('is-molar-mass-lab');
    if (config.instructions) {
        controls.querySelector('.lab-instructions').textContent = config.instructions;
    }

    const getParameters = () => ({
        temperature: Number(temperatureInput.value),
        volume: Number(initialVolumeInput.value),
        pressure: Number(initialPressureInput.value),
        molarMass: Number(gasSelect.selectedOptions[0].dataset.molarMass)
    });
    const updateRange = () => {
        const parameters = getParameters();
        volumeInput.max = String(Math.max(6, parameters.volume));
        volumeInput.value = String(parameters.volume);
    };
    const getState = () => {
        const parameters = getParameters();
        const temperatureKelvin = parameters.temperature + 273.15;
        const volume = Number(volumeInput.value);
        const pressure = parameters.pressure * parameters.volume / volume;
        const amount = parameters.pressure * parameters.volume / (gasConstant * temperatureKelvin);
        const mass = amount * parameters.molarMass;
        const meanKineticEnergy = 1.5 * boltzmannConstant * temperatureKelvin;
        return { ...parameters, temperatureKelvin, currentVolume: volume, currentPressure: pressure, amount, mass, meanKineticEnergy };
    };
    const validate = () => {
        initialInputs.forEach((input) => input.setCustomValidity(''));
        for (const input of initialInputs) {
            if (!input.reportValidity()) return false;
        }
        if (Number(temperatureInput.value) <= -273.15) {
            temperatureInput.setCustomValidity('Температура абсолют нөлден жоғары болуы керек.');
            temperatureInput.reportValidity();
            return false;
        }
        return true;
    };
    const updateReadings = () => {
        const state = getState();
        volumeValue.value = `${state.currentVolume.toFixed(1)} л`;
        volumeValue.textContent = `${state.currentVolume.toFixed(1)} л`;
        temperatureState.textContent = `T = ${state.temperatureKelvin.toFixed(2)} K · t = ${state.temperature.toFixed(1)} °C (const)`;
        massState.textContent = `m = ${state.mass.toFixed(6)} кг (const) · μ = ${state.molarMass.toFixed(3)} кг/моль`;
        pressureState.textContent = `Pᵢ = ${state.currentPressure.toFixed(2)} кПа · Vᵢ = ${state.currentVolume.toFixed(1)} л`;
        result.textContent = `P₀V₀ = ${(state.pressure * state.volume).toFixed(2)} кПа·л · Ēₖ = ${(state.meanKineticEnergy / 1e-21).toFixed(2)} × 10⁻²¹ Дж`;
    };
    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        [...initialInputs, volumeInput].forEach((input) => { input.disabled = running; });
    };
    const drawScene = () => {
        if (!width || !height) return;
        const state = getState();
        const scale = Math.min(width / 900, height / 600);
        const gaugeRadius = Math.max(55, Math.min(105, width * 0.11, height * 0.19));
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0b1a31';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(125, 165, 219, 0.09)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 38) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 38) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
        ctx.textAlign = 'center';

        const thermometerX = width * 0.11;
        const thermometerY = height * 0.17;
        const thermometerHeight = Math.min(height * 0.48, 290);
        ctx.fillStyle = '#d5e5e9';
        ctx.strokeStyle = '#708f90';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.roundRect(thermometerX, thermometerY, 62, thermometerHeight, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#a92943';
        ctx.fillRect(thermometerX + 28, thermometerY + 28, 7, thermometerHeight - 60);
        ctx.beginPath(); ctx.arc(thermometerX + 31.5, thermometerY + thermometerHeight - 28, 17, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8e6ff';
        ctx.font = `600 ${Math.max(12, 14 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`${state.temperature.toFixed(0)} °C`, thermometerX + 31, thermometerY + thermometerHeight + 25);
        ctx.fillText(`T = ${state.temperatureKelvin.toFixed(1)} K`, thermometerX + 31, thermometerY + thermometerHeight + 45);

        const cylinderLeft = width * 0.28;
        const cylinderRight = width * 0.76;
        const cylinderY = height * 0.68;
        const cylinderHeight = Math.max(62, Math.min(height * 0.16, 105));
        const pistonX = cylinderLeft + (state.currentVolume - Number(volumeInput.min))
            / (Number(volumeInput.max) - Number(volumeInput.min)) * (cylinderRight - cylinderLeft - 52) + 52;
        const cylinderGradient = ctx.createLinearGradient(0, cylinderY, 0, cylinderY + cylinderHeight);
        cylinderGradient.addColorStop(0, '#d7e8ef');
        cylinderGradient.addColorStop(0.18, '#6387a1');
        cylinderGradient.addColorStop(0.5, '#183a5b');
        cylinderGradient.addColorStop(0.84, '#7296ad');
        cylinderGradient.addColorStop(1, '#d6e5ec');
        ctx.fillStyle = cylinderGradient;
        ctx.beginPath(); ctx.roundRect(cylinderLeft, cylinderY, cylinderRight - cylinderLeft, cylinderHeight, 15); ctx.fill();
        ctx.strokeStyle = '#8bc6dc';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.rect(cylinderLeft + 8, cylinderY + 8, Math.max(2, pistonX - cylinderLeft - 12), cylinderHeight - 16);
        ctx.clip();
        particles.forEach((particle) => {
            ctx.fillStyle = particle.color;
            ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
        ctx.fillStyle = '#d5e5e9';
        ctx.fillRect(pistonX - 7, cylinderY - 5, 14, cylinderHeight + 10);
        ctx.fillStyle = '#385c77';
        ctx.fillRect(pistonX - 4, cylinderY - 24, 8, 24);
        ctx.fillStyle = '#d8e6ff';
        ctx.font = `600 ${Math.max(13, 16 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`Газ поршені · Vᵢ = ${state.currentVolume.toFixed(1)} л`, (cylinderLeft + cylinderRight) / 2, cylinderY + cylinderHeight + 30);
        ctx.strokeStyle = '#d8e6ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cylinderLeft + 30, cylinderY + cylinderHeight + 12);
        ctx.lineTo(cylinderLeft + 20, cylinderY + cylinderHeight + 54);
        ctx.moveTo(cylinderRight - 30, cylinderY + cylinderHeight + 12);
        ctx.lineTo(cylinderRight - 20, cylinderY + cylinderHeight + 54);
        ctx.stroke();

        const gaugeX = Math.min(width - gaugeRadius - 16, Math.max(gaugeRadius + 16, width * 0.72));
        const gaugeY = height * 0.34;
        const gradient = ctx.createRadialGradient(gaugeX - gaugeRadius * 0.3, gaugeY - gaugeRadius * 0.4, 4, gaugeX, gaugeY, gaugeRadius);
        gradient.addColorStop(0, '#f4fbff');
        gradient.addColorStop(0.76, '#bcd5df');
        gradient.addColorStop(1, '#416d83');
        ctx.fillStyle = '#2c7189';
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, gaugeRadius + 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, gaugeRadius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#406173';
        ctx.lineWidth = 2;
        for (let tick = 0; tick <= 20; tick += 1) {
            const angle = Math.PI * (0.78 + tick * 1.44 / 20);
            const inner = gaugeRadius * (tick % 5 === 0 ? 0.78 : 0.84);
            ctx.beginPath();
            ctx.moveTo(gaugeX + Math.cos(angle) * inner, gaugeY + Math.sin(angle) * inner);
            ctx.lineTo(gaugeX + Math.cos(angle) * gaugeRadius * 0.91, gaugeY + Math.sin(angle) * gaugeRadius * 0.91);
            ctx.stroke();
        }
        ctx.fillStyle = '#355b70';
        ctx.font = `600 ${Math.max(13, 15 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`${state.currentPressure.toFixed(1)} кПа`, gaugeX, gaugeY + gaugeRadius * 0.43);
        const needleAngle = Math.PI * (0.78 + (1 - Math.min(state.currentPressure / 1500, 1)) * 1.44);
        ctx.strokeStyle = '#bd2530';
        ctx.lineWidth = Math.max(3, 5 * scale);
        ctx.beginPath(); ctx.moveTo(gaugeX, gaugeY);
        ctx.lineTo(gaugeX + Math.cos(needleAngle) * gaugeRadius * 0.68, gaugeY + Math.sin(needleAngle) * gaugeRadius * 0.68);
        ctx.stroke();
        ctx.fillStyle = '#bd2530';
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, Math.max(5, 7 * scale), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8e6ff';
        ctx.font = `600 ${Math.max(13, 16 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`Қысым Pᵢ = ${state.currentPressure.toFixed(2)} кПа`, gaugeX, gaugeY + gaugeRadius + 32);
        ctx.fillStyle = '#ffd2da';
        ctx.font = `600 ${Math.max(15, 20 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(running ? (paused ? 'Тәжірибе тоқтатылды' : 'Изотермиялық процесс жүріп жатыр') : 'T = const · m = const', width / 2, height * 0.1);
    };
    const resizeCanvas = () => {
        const bounds = stageCanvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        stageCanvas.width = Math.round(width * pixelRatio);
        stageCanvas.height = Math.round(height * pixelRatio);
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        particles = Array.from({ length: 42 }, () => ({
            x: width * (0.29 + Math.random() * 0.08),
            y: height * 0.76 + (Math.random() - 0.5) * 55,
            vx: (Math.random() - 0.5) * 2.4,
            vy: (Math.random() - 0.5) * 2.4,
            radius: 2 + Math.random() * 2,
            color: Math.random() < 0.5 ? '#53c9ff' : '#ff7590'
        }));
        drawScene();
    };
    const updateParameters = () => {
        const parameters = getParameters();
        if (parameters.temperature + 273.15 <= 0) return;
        updateRange();
        updateReadings();
        status.textContent = 'Бастапқы параметрлер жаңартылды. T тұрақты болғандағы қысым-көлем байланысын бақыла.';
        drawScene();
    };
    const animate = (time) => {
        if (running && !paused) {
            elapsed = time - startedAt;
            const phase = (elapsed % 10000) / 10000;
            const triangle = phase < 0.5 ? phase * 2 : 2 - phase * 2;
            const minVolume = Number(volumeInput.min);
            const maxVolume = Number(volumeInput.max);
            volumeInput.value = String(minVolume + triangle * (maxVolume - minVolume));
            updateReadings();
        }
        const delta = previousFrame ? Math.min((time - previousFrame) / 16.67, 2) : 1;
        previousFrame = time;
        if (!paused) {
            const state = getState();
            const cylinderLeft = width * 0.28;
            const cylinderRight = width * 0.76;
            const cylinderY = height * 0.68;
            const cylinderHeight = Math.max(62, Math.min(height * 0.16, 105));
            const pistonX = cylinderLeft + (state.currentVolume - Number(volumeInput.min))
                / (Number(volumeInput.max) - Number(volumeInput.min)) * (cylinderRight - cylinderLeft - 52) + 52;
            const thermalSpeed = Math.sqrt(state.temperatureKelvin / 293.15);
            particles.forEach((particle) => {
                particle.x += particle.vx * thermalSpeed * delta;
                particle.y += particle.vy * thermalSpeed * delta;
                if (particle.x < cylinderLeft + 12 || particle.x > pistonX - 10) particle.vx *= -1;
                if (particle.y < cylinderY + 10 || particle.y > cylinderY + cylinderHeight - 10) particle.vy *= -1;
                particle.x = Math.min(pistonX - 10, Math.max(cylinderLeft + 12, particle.x));
                particle.y = Math.min(cylinderY + cylinderHeight - 10, Math.max(cylinderY + 10, particle.y));
            });
        }
        drawScene();
        if (overlay.classList.contains('is-open')) frameId = window.requestAnimationFrame(animate);
    };
    const openLab = async () => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(animate);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };
    const closeLab = async () => {
        window.cancelAnimationFrame(frameId);
        if (running && !paused) {
            elapsed = performance.now() - startedAt;
            paused = true;
            updateControls();
        }
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };
    startButton.addEventListener('click', () => {
        if (!validate()) return;
        if (paused) {
            paused = false;
            startedAt = performance.now() - elapsed;
            status.textContent = 'Изотермиялық процесс жалғасуда.';
        } else {
            running = true;
            elapsed = 0;
            startedAt = performance.now();
            status.textContent = 'Изотермиялық процесс басталды. Температура мен масса тұрақты.';
        }
        running = true;
        paused = false;
        updateControls();
    });
    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            paused = false;
            startedAt = performance.now() - elapsed;
            status.textContent = 'Изотермиялық процесс жалғасуда.';
        } else {
            elapsed = performance.now() - startedAt;
            paused = true;
            status.textContent = 'Процесс уақытша тоқтатылды.';
        }
        updateControls();
    });
    stopButton.addEventListener('click', () => {
        running = false;
        paused = false;
        elapsed = 0;
        updateRange();
        updateControls();
        updateReadings();
        status.textContent = 'Процесс тоқтатылды. Бастапқы күйге оралды.';
        drawScene();
    });
    initialInputs.forEach((input) => {
        input.addEventListener('input', () => {
            input.setCustomValidity('');
            if (!running) updateParameters();
        });
        input.addEventListener('change', () => {
            if (!running) updateParameters();
        });
    });
    volumeInput.addEventListener('input', () => {
        updateReadings();
        status.textContent = 'Көлем өзгерді. T = const кезінде қысым кері пропорционал өзгереді.';
        drawScene();
    });
    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('is-open') && !document.fullscreenElement) closeLab();
    });
    window.addEventListener('resize', resizeCanvas);
    updateRange();
    updateReadings();
    updateControls();
}

function initializeMolarMassLab(elements) {
    const { overlay, canvas, openButton, closeButton, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('molarMassLabControls');
    const standardControls = document.getElementById('standardLabControls');
    const legend = document.getElementById('labLegend');
    const stageCanvas = document.getElementById('molarMassCanvas');
    const stageContext = stageCanvas.getContext('2d');
    const gasSelect = document.getElementById('molarMassGas');
    const fields = {
        temperature: document.getElementById('molarMassTemperature'),
        volume: document.getElementById('molarMassVolume'),
        initialMass: document.getElementById('molarMassInitialMass'),
        finalMass: document.getElementById('molarMassFinalMass'),
        initialPressure: document.getElementById('molarMassInitialPressure'),
        finalPressure: document.getElementById('molarMassFinalPressure')
    };
    const inputs = [gasSelect, ...Object.values(fields)];
    const startButton = document.getElementById('molarMassStart');
    const pauseButton = document.getElementById('molarMassPause');
    const resetButton = document.getElementById('molarMassReset');
    const status = document.getElementById('molarMassStatus');
    const result = document.getElementById('molarMassResult');
    const comparison = document.getElementById('molarMassComparison');
    const gasConstant = 8.314;
    const avogadroConstant = 6.02214076e23;
    const duration = 5000;
    let width = 0;
    let height = 0;
    let progress = 0;
    let running = false;
    let paused = false;
    let elapsed = 0;
    let startedAt = 0;
    let frameId = 0;
    let previousFrame = 0;
    let bubbles = [];

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = 'Виртуалды зертхана • 10-сынып';
    document.getElementById('labCanvas').classList.add('hidden');
    stageCanvas.classList.remove('hidden');
    stageCanvas.setAttribute('aria-label', 'Газ баллоны, термометр және манометр көрсетілген тәжірибе');
    standardControls.classList.add('hidden');
    controls.classList.remove('hidden');
    legend.classList.add('hidden');
    labWindow.classList.add('is-molar-mass-lab');

    const getValues = () => Object.fromEntries(
        Object.entries(fields).map(([name, input]) => [name, Number(input.value)])
    );

    const validate = () => {
        inputs.forEach((input) => input.setCustomValidity(''));
        for (const input of inputs) {
            if (!input.reportValidity()) return false;
        }
        const values = getValues();
        if (values.initialMass <= values.finalMass) {
            fields.finalMass.setCustomValidity('Газ шыққаннан кейінгі масса бастапқы массадан аз болуы керек.');
            fields.finalMass.reportValidity();
            return false;
        }
        if (values.initialPressure <= values.finalPressure) {
            fields.finalPressure.setCustomValidity('Газ шыққаннан кейінгі қысым бастапқы қысымнан аз болуы керек.');
            fields.finalPressure.reportValidity();
            return false;
        }
        return true;
    };

    const calculate = () => {
        const values = getValues();
        const temperature = values.temperature + 273.15;
        const pressureChange = values.initialPressure - values.finalPressure;
        const massChange = values.initialMass - values.finalMass;
        const amount = pressureChange * values.volume / (gasConstant * temperature);
        const molarMass = massChange / amount;
        const referenceMass = Number(gasSelect.selectedOptions[0].dataset.mass);
        return {
            molarMass,
            amount,
            particles: amount * avogadroConstant,
            referenceMass,
            deviation: Math.abs(molarMass * 1000 - referenceMass) / referenceMass * 100
        };
    };

    const showResult = () => {
        const measured = calculate();
        const gasName = gasSelect.value;
        result.textContent = `M = ${(measured.molarMass * 1000).toFixed(2)} г/моль · n = ${measured.amount.toExponential(2)} моль`;
        comparison.textContent = `N = ${measured.particles.toExponential(2)} бөлшек · анықтамалық M(${gasName}) = ${measured.referenceMass} г/моль · ауытқу ${measured.deviation.toFixed(1)}%`;
    };

    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        inputs.forEach((input) => { input.disabled = running; });
    };

    const reset = () => {
        running = false;
        paused = false;
        elapsed = 0;
        progress = 0;
        gasSelect.value = 'N₂';
        fields.temperature.value = '20';
        fields.volume.value = '0.003';
        fields.initialMass.value = '0.05';
        fields.finalMass.value = '0.049827';
        fields.initialPressure.value = '101000';
        fields.finalPressure.value = '96000';
        inputs.forEach((input) => input.setCustomValidity(''));
        status.textContent = 'Газды таңдап, Пуск батырмасын бас.';
        result.textContent = 'M = — · n = —';
        comparison.textContent = 'Анықтамалық мән: —';
        updateControls();
        drawScene();
    };

    const resizeCanvas = () => {
        const bounds = stageCanvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        stageCanvas.width = Math.round(width * pixelRatio);
        stageCanvas.height = Math.round(height * pixelRatio);
        stageContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        bubbles = Array.from({ length: 34 }, () => ({
            x: Math.random(),
            y: 0.43 + Math.random() * 0.34,
            radius: 2 + Math.random() * 4,
            speed: 0.01 + Math.random() * 0.025
        }));
        drawScene();
    };

    const drawScene = () => {
        if (!width || !height) return;
        const ctx = stageContext;
        const scale = Math.min(width / 900, height / 600);
        const radius = Math.max(58, Math.min(110, width * 0.12, height * 0.2));
        const pressure = getValues().initialPressure
            - (getValues().initialPressure - getValues().finalPressure) * progress;
        const pressureRatio = Math.min(1, Math.max(0, pressure / Math.max(1, getValues().initialPressure)));

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#0b1a31';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(125, 165, 219, 0.09)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 38) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 38) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        const tankX = width * 0.12;
        const tankY = height * 0.28;
        const tankWidth = Math.max(90, Math.min(160, width * 0.2));
        const tankHeight = Math.min(height * 0.48, 260);
        const tankGradient = ctx.createLinearGradient(tankX, 0, tankX + tankWidth, 0);
        tankGradient.addColorStop(0, '#315979');
        tankGradient.addColorStop(0.18, '#b7d8e6');
        tankGradient.addColorStop(0.47, '#517c9d');
        tankGradient.addColorStop(0.82, '#c6e1e9');
        tankGradient.addColorStop(1, '#274963');
        ctx.fillStyle = tankGradient;
        ctx.beginPath();
        ctx.roundRect(tankX, tankY, tankWidth, tankHeight, [22, 22, 16, 16]);
        ctx.fill();
        ctx.strokeStyle = '#8bc6dc';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(17, 40, 67, 0.7)';
        ctx.fillRect(tankX + 14, tankY + 18, tankWidth - 28, tankHeight - 36);
        ctx.save();
        ctx.beginPath();
        ctx.rect(tankX + 15, tankY + 18, tankWidth - 30, tankHeight - 36);
        ctx.clip();
        bubbles.forEach((bubble, index) => {
            const hiddenCount = Math.floor(progress * bubbles.length * 0.62);
            if (index < hiddenCount) return;
            const bx = tankX + 22 + bubble.x * (tankWidth - 44);
            const by = tankY + 24 + bubble.y * (tankHeight - 48);
            const bubbleGradient = ctx.createRadialGradient(bx - bubble.radius * 0.3, by - bubble.radius * 0.3, 0, bx, by, bubble.radius * 2.2);
            bubbleGradient.addColorStop(0, '#ffffff');
            bubbleGradient.addColorStop(0.35, '#6dd9ff');
            bubbleGradient.addColorStop(1, 'rgba(54, 169, 255, 0)');
            ctx.fillStyle = bubbleGradient;
            ctx.beginPath(); ctx.arc(bx, by, bubble.radius * 2.2, 0, Math.PI * 2); ctx.fill();
        });
        ctx.restore();
        ctx.fillStyle = '#c9e7f2';
        ctx.font = `600 ${Math.max(14, 17 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`Газ баллоны · ${gasSelect.value}`, tankX + tankWidth / 2, tankY + tankHeight + 30);

        const gaugeX = Math.min(width - radius - 20, Math.max(radius + 20, width * 0.74));
        const gaugeY = Math.min(height - radius - 90, Math.max(radius + 60, height * 0.42));
        const gaugeRadius = radius;
        const gaugeGradient = ctx.createRadialGradient(gaugeX - gaugeRadius * 0.35, gaugeY - gaugeRadius * 0.42, 4, gaugeX, gaugeY, gaugeRadius);
        gaugeGradient.addColorStop(0, '#f4fbff');
        gaugeGradient.addColorStop(0.75, '#bcd5df');
        gaugeGradient.addColorStop(1, '#416d83');
        ctx.fillStyle = '#2c7189';
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, gaugeRadius + 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = gaugeGradient;
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, gaugeRadius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#406173';
        ctx.lineWidth = 2;
        for (let tick = 0; tick <= 20; tick += 1) {
            const angle = Math.PI * (0.78 + tick * 1.44 / 20);
            const inner = gaugeRadius * (tick % 5 === 0 ? 0.78 : 0.84);
            ctx.beginPath();
            ctx.moveTo(gaugeX + Math.cos(angle) * inner, gaugeY + Math.sin(angle) * inner);
            ctx.lineTo(gaugeX + Math.cos(angle) * gaugeRadius * 0.91, gaugeY + Math.sin(angle) * gaugeRadius * 0.91);
            ctx.stroke();
        }
        ctx.fillStyle = '#355b70';
        ctx.font = `600 ${Math.max(12, 14 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`${Math.round(pressure / 1000)} кПа`, gaugeX, gaugeY + gaugeRadius * 0.45);
        const needleAngle = Math.PI * (0.78 + (1 - pressureRatio) * 1.44);
        ctx.strokeStyle = '#bd2530';
        ctx.lineWidth = Math.max(3, 5 * scale);
        ctx.beginPath();
        ctx.moveTo(gaugeX, gaugeY);
        ctx.lineTo(gaugeX + Math.cos(needleAngle) * gaugeRadius * 0.69, gaugeY + Math.sin(needleAngle) * gaugeRadius * 0.69);
        ctx.stroke();
        ctx.fillStyle = '#bd2530';
        ctx.beginPath(); ctx.arc(gaugeX, gaugeY, Math.max(5, 7 * scale), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8e6ff';
        ctx.font = `600 ${Math.max(13, 16 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(`Қысым: ${Math.round(pressure).toLocaleString('kk-KZ')} Па`, gaugeX, gaugeY + gaugeRadius + 38);
        ctx.fillStyle = '#ffd2da';
        ctx.font = `600 ${Math.max(15, 20 * scale)}px Segoe UI, Arial, sans-serif`;
        ctx.fillText(running ? (paused ? 'Тәжірибе уақытша тоқтатылды' : 'Газ шығару жүріп жатыр…') : 'Тәжірибені бастауға дайын', width / 2, height * 0.12);
        if (progress === 1) {
            ctx.fillStyle = '#b7f4ce';
            ctx.fillText(`Өлшенген газ массасы: ${(getValues().initialMass - getValues().finalMass).toFixed(6)} кг`, width / 2, height - 22);
        }
    };

    const animate = (time) => {
        if (running && !paused) {
            elapsed = time - startedAt;
            progress = Math.min(1, elapsed / duration);
            if (progress >= 1) {
                progress = 1;
                running = false;
                status.textContent = 'Тәжірибе аяқталды. Нәтижені анықтамалық молярлық массамен салыстыр.';
                showResult();
                updateControls();
            }
        }
        if (!paused) {
            const delta = previousFrame ? Math.min((time - previousFrame) / 1000, 0.05) : 0;
            bubbles.forEach((bubble) => {
                bubble.y -= bubble.speed * delta;
                if (bubble.y < 0) bubble.y = 1;
            });
        }
        previousFrame = time;
        drawScene();
        if (overlay.classList.contains('is-open')) frameId = window.requestAnimationFrame(animate);
    };

    const openLab = async () => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(animate);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };

    const closeLab = async () => {
        window.cancelAnimationFrame(frameId);
        if (running && !paused) {
            paused = true;
            updateControls();
        }
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };

    startButton.addEventListener('click', () => {
        if (!validate()) return;
        if (paused) {
            paused = false;
            startedAt = performance.now() - elapsed;
            status.textContent = 'Тәжірибе жалғасуда…';
        } else {
            progress = 0;
            elapsed = 0;
            startedAt = performance.now();
            running = true;
            status.textContent = 'Газ баллонынан газ шығуда. Манометр көрсеткішін бақыла.';
            result.textContent = 'M = есептелуде · n = есептелуде';
            comparison.textContent = 'Қысым мен массаның өзгерісі өлшенуде.';
        }
        running = true;
        paused = false;
        updateControls();
        drawScene();
    });

    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            paused = false;
            startedAt = performance.now() - elapsed;
            status.textContent = 'Тәжірибе жалғасуда…';
        } else {
            elapsed = performance.now() - startedAt;
            paused = true;
            status.textContent = 'Тәжірибе тоқтатылды. Жалғастыру үшін батырманы бас.';
        }
        updateControls();
        drawScene();
    });

    resetButton.addEventListener('click', reset);
    inputs.forEach((input) => input.addEventListener('input', () => {
        input.setCustomValidity('');
        if (!running) {
            status.textContent = 'Параметрлер жаңартылды. Өлшеуді қайта баста.';
            result.textContent = 'M = — · n = —';
            comparison.textContent = 'Анықтамалық мән: —';
            drawScene();
        }
    }));
    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('is-open') && !document.fullscreenElement) closeLab();
    });
    window.addEventListener('resize', resizeCanvas);
    reset();
}

function initializeMoleculeLab(config) {
    const overlay = document.getElementById('moleculeLab');
    const canvas = document.getElementById('labCanvas');
    const openButton = document.getElementById('openMoleculeLab');
    const closeButton = document.getElementById('closeMoleculeLab');
    const dividerButton = document.getElementById('labDividerButton');
    const pauseButton = document.getElementById('labPauseButton');
    const resetButton = document.getElementById('labResetButton');
    const temperatureInput = document.getElementById('labTemperature');
    const temperatureValue = document.getElementById('labTemperatureValue');
    const temperatureLabel = document.getElementById('labTemperatureLabel');
    const labTitle = document.getElementById('labTitle');
    const labGradeLabel = document.getElementById('labGradeLabel');
    const labIntro = document.getElementById('labIntro');
    const status = document.getElementById('labStatus');
    const counts = document.getElementById('labCounts');
    const context = canvas.getContext('2d');

    if (config.mode === 'molar-mass') {
        initializeMolarMassLab({ overlay, canvas, openButton, closeButton, context, config });
        return;
    }

    if (config.mode === 'gas-constant') {
        initializeGasConstantLab({ overlay, canvas, openButton, closeButton, config });
        return;
    }

    if (config.mode === 'isothermal') {
        initializeIsothermalLab({ overlay, canvas, openButton, closeButton, config });
        return;
    }

    if (config.mode === 'maxwell') {
        initializeMaxwellLab({ overlay, openButton, closeButton, config });
        return;
    }

    if (config.mode === 'combustion') {
        initializeCombustionLab({ overlay, canvas, openButton, closeButton, context, config });
        return;
    }

    if (config.mode === 'heat-exchange') {
        initializeHeatExchangeLab({ overlay, canvas, openButton, closeButton, context, config });
        return;
    }

    if (config.mode === 'brownian-study') {
        initializeBrownianLab({ overlay, canvas, openButton, closeButton, context, config });
        return;
    }

    if (config.mode === 'diffusion-study') {
        initializeDiffusionLab({ overlay, canvas, openButton, closeButton, context, config });
        return;
    }

    if (config.mode === 'ice-melting') {
        initializeIceMeltingLab({ overlay, canvas, openButton, closeButton, context, config });
        return;
    }

    if (config.mode === 'evaporation-psychrometer') {
        initializeEvaporationLab({ overlay, canvas, openButton, closeButton, context, config });
        return;
    }

    const colors = ['#ff354d', '#36a9ff', '#fff2a8'];
    let particles = [];
    let width = 0;
    let height = 0;
    let previousTime = 0;
    let dividerClosed = true;
    let paused = false;
    let open = false;
    let animationId = 0;
    let bondsFormed = false;
    let workApplied = false;
    let collisionCount = 0;
    labTitle.textContent = config.title;
    labGradeLabel.textContent = `Виртуалды зертхана • ${new URLSearchParams(window.location.search).get('grade') || '7'}-сынып`;
    labIntro.textContent = config.intro;
    temperatureLabel.textContent = config.temperatureLabel || 'Температура деңгейі';
    temperatureInput.min = config.inputMin ?? 1;
    temperatureInput.max = config.inputMax ?? 10;
    temperatureInput.step = config.inputStep ?? 1;
    temperatureInput.value = config.initialTemperature ?? 4;
    temperatureValue.value = temperatureInput.value;
    temperatureValue.textContent = `${temperatureInput.value} ${config.inputUnit || ''}`.trim();
    dividerButton.textContent = config.actionLabel;
    document.querySelector('.lab-instructions').innerHTML = config.instructions;
    let currentTemperature = Number(temperatureInput.value);
    let pistonCompressed = false;
    const phaseModes = ['states', 'structure', 'phasechange'];
    const getPhase = () => config.mode === 'phasechange'
        ? currentTemperature < 40 ? 0 : currentTemperature < 70 ? 1 : 2
        : currentTemperature < 4 ? 0 : currentTemperature < 7 ? 1 : 2;
    let aggregatePhase = phaseModes.includes(config.mode)
        ? currentTemperature < 4 ? 0 : currentTemperature < 7 ? 1 : 2
        : -1;
    if (config.mode === 'phasechange') aggregatePhase = getPhase();

    const speedForTemperature = (temperature = currentTemperature) => {
        if (config.speedModel === 'kelvin') return Math.sqrt(Math.max(0, temperature)) * 3.5;
        if (config.mode === 'thermometer') return 16 + Math.max(-20, temperature) * 0.7;
        if (config.mode === 'phasechange') return 12 + temperature * 0.35;
        return 24 + temperature * 13;
    };

    const phaseDescription = () => {
        const phase = ['Қатты күй', 'Сұйық күй', 'Газ күйі'][aggregatePhase];
        return aggregatePhase === 0
            ? `${phase}: бөлшектер тығыз орналасып, баяу тербеледі.`
            : aggregatePhase === 1
                ? `${phase}: бөлшектер жақын, бірақ бір-бірінің жанынан қозғалады.`
                : `${phase}: бөлшектер алшақ орналасып, еркін қозғалады.`;
    };

    const chamberBounds = () => {
        const margin = Math.max(24, Math.min(48, width * 0.06));
        const outerRight = width - margin;
        const right = (config.mode === 'pressure' || config.mode === 'gaslaw') && pistonCompressed
            ? margin + (outerRight - margin) * 0.62
            : outerRight;
        return {
            left: margin,
            right,
            outerRight,
            top: margin,
            bottom: height - margin
        };
    };

    const resizeCanvas = () => {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        if (width > 0 && height > 0 && (!particles.length || config.mode === 'compare')) resetParticles();
        if (particles.length && config.mode !== 'compare') {
            const bounds = chamberBounds();
            particles.forEach((particle) => {
                particle.x = Math.max(bounds.left + particle.radius, Math.min(bounds.right - particle.radius, particle.x));
                particle.y = Math.max(bounds.top + particle.radius, Math.min(bounds.bottom - particle.radius, particle.y));
            });
        }
    };

    const resetParticles = () => {
        const bounds = chamberBounds();
        const midpoint = (bounds.left + bounds.right) / 2;
        const radius = Math.max(3, Math.min(7, width / 110));
        particles = [];
        const atomPairs = config.mode === 'atoms'
            ? Array.from({ length: 16 }, () => ({
                x: bounds.left + radius * 5 + Math.random() * Math.max(1, bounds.right - bounds.left - radius * 10),
                y: bounds.top + radius * 5 + Math.random() * Math.max(1, bounds.bottom - bounds.top - radius * 10)
            }))
            : [];

        for (let index = 0; index < 32; index += 1) {
            const isRed = config.mode === 'atoms' ? index % 2 === 0 : index < 16;
            const angle = Math.random() * Math.PI * 2;
            let sideMin = bounds.left + radius * 2;
            let sideMax = bounds.right - radius * 2;
            let particleY = bounds.top + radius * 2 + Math.random() * Math.max(1, bounds.bottom - bounds.top - radius * 4);

            if (config.mode === 'diffusion' || config.mode === 'heat' || config.mode === 'brownian') {
                sideMin = isRed ? bounds.left + radius * 2 : midpoint + radius * 2;
                sideMax = isRed ? midpoint - radius * 2 : bounds.right - radius * 2;
            } else if (config.mode === 'compare') {
                const panelWidth = (bounds.right - bounds.left) / 2;
                const isSolid = index < 16;
                const itemIndex = isSolid ? index : index - 16;
                const column = itemIndex % 4;
                const row = Math.floor(itemIndex / 4);
                const panelLeft = isSolid ? bounds.left : midpoint;
                const panelPadding = panelWidth * 0.13;
                sideMin = panelLeft + panelPadding + column * Math.max(1, (panelWidth - panelPadding * 2) / 3);
                sideMax = sideMin + 1;
                particleY = bounds.top + (bounds.bottom - bounds.top) * 0.24 + row * (bounds.bottom - bounds.top) * 0.16;
                if (!isSolid) {
                    sideMin = midpoint + panelPadding;
                    sideMax = bounds.right - panelPadding;
                    particleY = bounds.top + (bounds.bottom - bounds.top) * 0.18 + Math.random() * (bounds.bottom - bounds.top) * 0.64;
                }
            } else if (phaseModes.includes(config.mode) && aggregatePhase === 0) {
                const column = index % 8;
                const row = Math.floor(index / 8);
                const latticeWidth = Math.min((bounds.right - bounds.left) * 0.52, radius * 12);
                const latticeHeight = Math.min((bounds.bottom - bounds.top) * 0.5, radius * 9);
                sideMin = bounds.left + (bounds.right - bounds.left - latticeWidth) / 2 + column * latticeWidth / 8;
                sideMax = sideMin + 1;
                particleY = bounds.top + (bounds.bottom - bounds.top - latticeHeight) / 2 + row * latticeHeight / 4;
            } else if (phaseModes.includes(config.mode) && aggregatePhase === 1) {
                sideMin = bounds.left + (bounds.right - bounds.left) * 0.2;
                sideMax = bounds.left + (bounds.right - bounds.left) * 0.8;
                particleY = bounds.top + (bounds.bottom - bounds.top) * 0.48 + Math.random() * (bounds.bottom - bounds.top) * 0.35;
            } else if (config.mode === 'atoms') {
                const pairIndex = Math.floor(index / 2);
                sideMin = atomPairs[pairIndex].x + (isRed ? -radius * 1.4 : radius * 1.4);
                sideMax = sideMin + 1;
                particleY = atomPairs[pairIndex].y;
            }

            let speed = speedForTemperature();
            if (config.mode === 'states' || config.mode === 'structure' || config.mode === 'phasechange') {
                speed *= aggregatePhase === 0 ? 0.16 : aggregatePhase === 1 ? 0.55 : 1.15;
            } else if (config.mode === 'heat') {
                speed *= isRed ? 1.7 : 0.45;
            } else if (config.mode === 'atoms') {
                speed = 0;
            } else if (config.mode === 'compare' && index < 16) {
                speed *= 0.08;
            }

            particles.push({
                x: sideMin + Math.random() * Math.max(1, sideMax - sideMin),
                y: particleY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius,
                color: isRed ? 0 : 1,
                pair: config.mode === 'atoms' ? Math.floor(index / 2) : null,
                sample: config.mode === 'compare' ? (index < 16 ? 'solid' : 'liquid') : null,
                homeX: config.mode === 'compare' && index < 16 ? sideMin : null,
                homeY: config.mode === 'compare' && index < 16 ? particleY : null
            });
        }

        if (config.mode === 'brownian') {
            particles.push({
                x: bounds.left + (bounds.right - bounds.left) * 0.24,
                y: (bounds.top + bounds.bottom) / 2,
                vx: 0,
                vy: 0,
                radius: radius * 2.4,
                color: 2,
                tracer: true
            });
        }

        dividerClosed = config.mode === 'diffusion' || config.mode === 'heat' || config.mode === 'brownian';
        pistonCompressed = false;
        paused = false;
        bondsFormed = false;
        workApplied = false;
        collisionCount = 0;
        if (phaseModes.includes(config.mode)) aggregatePhase = getPhase();
        dividerButton.textContent = config.actionLabel;
        pauseButton.textContent = 'Тоқтату';
        if (config.mode === 'diffusion' || config.mode === 'heat' || config.mode === 'brownian') {
            status.textContent = 'Бөлгіш жабық. Бөлшектер екі жақта қозғалады.';
        } else if (config.mode === 'states' || config.mode === 'structure' || config.mode === 'phasechange') {
            status.textContent = phaseDescription();
        } else if (config.mode === 'compare') {
            status.textContent = 'Қатты дене сол жақта, сұйық үлгісі оң жақта көрсетілген.';
        } else if (config.mode === 'mkt') {
            status.textContent = 'Бөлшектер ретсіз қозғалады. Қозғалыс бағыты мен қабырғаға соқтығысуын бақыла.';
        } else if (config.mode === 'pressure' || config.mode === 'gaslaw') {
            status.textContent = 'Поршень ашық. Газ қалыпты көлемде қозғалады.';
        } else if (config.mode === 'atoms') {
            status.textContent = 'Атомдар әлі молекула болып байланыспаған.';
        } else {
            status.textContent = 'Бөлшектер қозғалып жатыр. Негізгі шаманы өзгертіп, нәтижені бақыла.';
        }
        updateCounts();
    };

    const updateCounts = () => {
        if (config.mode === 'amount') {
            const amount = Number(currentTemperature);
            const particleCount = amount * 6.02214076e23;
            const molarMass = config.molarMass ?? 18;
            counts.textContent = `N = ${particleCount.toExponential(2)} бөлшек · m = ${(amount * molarMass).toFixed(1)} г (${config.substance || 'H₂O үлгісі'})`;
            return;
        }

        if (config.mode === 'thermo') {
            const heatIn = currentTemperature * 10;
            const work = heatIn * (config.efficiency ?? 0.35);
            counts.textContent = `Q = ${heatIn.toFixed(0)} кДж · A = ${work.toFixed(1)} кДж · ПӘК = ${Math.round((config.efficiency ?? 0.35) * 100)}%`;
            return;
        }

        if (config.mode === 'pressure' || config.mode === 'gaslaw') {
            const bounds = chamberBounds();
            const volumeRatio = (bounds.right - bounds.left) / (bounds.outerRight - bounds.left);
            const temperatureRatio = config.mode === 'gaslaw'
                ? currentTemperature / (config.initialTemperature || 4)
                : 1;
            const relativePressure = temperatureRatio / volumeRatio;
            counts.textContent = config.mode === 'gaslaw'
                ? `pV/T = const · V: ${Math.round(volumeRatio * 100)}% · p салыстырмалы: ${relativePressure.toFixed(1)}×`
                : `Көлем: ${Math.round(volumeRatio * 100)}% · Салыстырмалы қысым: ${relativePressure.toFixed(1)}×`;
            return;
        }

        if (config.mode === 'states' || config.mode === 'structure') {
            const phaseNames = ['Қатты күй', 'Сұйық күй', 'Газ күйі'];
            counts.textContent = `${phaseNames[aggregatePhase]} · Бөлшектер: ${particles.length}`;
            return;
        }

        if (config.mode === 'phasechange') {
            const phaseNames = ['Қатты күй', 'Балқу аймағы', 'Газ күйі'];
            counts.textContent = `${phaseNames[aggregatePhase]} · Температура: ${currentTemperature} °C · Үлгі бөлшектері: ${particles.length}`;
            return;
        }

        if (config.mode === 'compare') {
            counts.textContent = `Қатты дене: 16 бөлшек · Сұйық: 16 бөлшек · Температура: ${currentTemperature}`;
            return;
        }

        if (config.mode === 'mkt') {
            const averageSpeed = particles.reduce((total, particle) => total + Math.hypot(particle.vx, particle.vy), 0) / particles.length;
            counts.textContent = `Қабырғаға соқтығысу: ${collisionCount} · Орташа жылдамдық: ${Math.round(averageSpeed)} шартты бірлік`;
            return;
        }

        if (config.mode === 'motion' || config.mode === 'brownian') {
            const averageSpeed = particles.reduce((total, particle) => total + Math.hypot(particle.vx, particle.vy), 0) / particles.length;
            counts.textContent = config.mode === 'brownian'
                ? `Броундық бөлшек: ${particles.filter((particle) => particle.tracer).length} · Орташа қозғалыс: ${Math.round(averageSpeed)} бірлік`
                : `Орташа жылдамдық: ${Math.round(averageSpeed)} шартты бірлік`;
            return;
        }

        if (config.mode === 'atoms') {
            counts.textContent = `Атомдар: 32 · Түзілген молекула: ${bondsFormed ? 16 : 0}`;
            return;
        }

        if (config.mode === 'ideal') {
            const averageSquaredSpeed = particles.reduce((total, particle) => total + particle.vx ** 2 + particle.vy ** 2, 0) / particles.length;
            counts.textContent = `p = ⅓ρ⟨v²⟩ · Орташа ⟨v²⟩: ${Math.round(averageSquaredSpeed)} бірлік²`;
            return;
        }

        if (config.mode === 'thermometer' || config.mode === 'absolute') {
            const celsius = config.mode === 'absolute' ? currentTemperature - 273.15 : currentTemperature;
            const kelvin = config.mode === 'absolute' ? currentTemperature : currentTemperature + 273.15;
            counts.textContent = `t = ${celsius.toFixed(1)} °C · T = ${kelvin.toFixed(1)} K`;
            return;
        }

        if (config.mode === 'internal') {
            const averageSpeedSquared = particles.reduce((total, particle) => total + particle.vx ** 2 + particle.vy ** 2, 0) / particles.length;
            counts.textContent = `Ішкі энергия ∼ бөлшектердің ⟨v²⟩: ${Math.round(averageSpeedSquared)} бірлік²`;
            return;
        }

        const bounds = chamberBounds();
        const midpoint = (bounds.left + bounds.right) / 2;
        const redLeft = particles.filter((particle) => particle.color === 0 && particle.x < midpoint).length;
        const blueRight = particles.filter((particle) => particle.color === 1 && particle.x >= midpoint).length;
        counts.textContent = `Қызыл сол жақта: ${redLeft} · Көк оң жақта: ${blueRight}`;
    };

    const collideWithWalls = (particle, previousX) => {
        const bounds = chamberBounds();
        const particleBounds = config.mode === 'compare'
            ? particle.sample === 'solid'
                ? { ...bounds, right: (bounds.left + bounds.right) / 2 - particle.radius * 2 }
                : { ...bounds, left: (bounds.left + bounds.right) / 2 + particle.radius * 2 }
            : bounds;
        if (particle.x < particleBounds.left + particle.radius || particle.x > particleBounds.right - particle.radius) {
            particle.vx *= -1;
            particle.x = Math.max(particleBounds.left + particle.radius, Math.min(particleBounds.right - particle.radius, particle.x));
            if (config.mode === 'mkt') collisionCount += 1;
        }
        if (particle.y < bounds.top + particle.radius || particle.y > bounds.bottom - particle.radius) {
            particle.vy *= -1;
            particle.y = Math.max(bounds.top + particle.radius, Math.min(bounds.bottom - particle.radius, particle.y));
            if (config.mode === 'mkt') collisionCount += 1;
        }

        if (dividerClosed && config.mode !== 'compare') {
            const midpoint = (bounds.left + bounds.right) / 2;
            const crossedFromLeft = previousX < midpoint && particle.x + particle.radius > midpoint;
            const crossedFromRight = previousX >= midpoint && particle.x - particle.radius < midpoint;
            if (crossedFromLeft || crossedFromRight) {
                particle.vx *= -1;
                particle.x = crossedFromLeft ? midpoint - particle.radius : midpoint + particle.radius;
            }
        }
    };

    const collideParticles = () => {
        for (let first = 0; first < particles.length; first += 1) {
            for (let second = first + 1; second < particles.length; second += 1) {
                const a = particles[first];
                const b = particles[second];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const distance = Math.hypot(dx, dy);
                const minimumDistance = a.radius + b.radius;
                if (!distance || distance >= minimumDistance) continue;
                if (config.mode === 'compare' && (a.sample === 'solid' || b.sample === 'solid' || a.sample !== b.sample)) continue;
                if (config.mode === 'mkt') collisionCount += 1;

                const nx = dx / distance;
                const ny = dy / distance;
                const relativeSpeed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
                const overlap = minimumDistance - distance;
                a.x -= nx * overlap / 2;
                a.y -= ny * overlap / 2;
                b.x += nx * overlap / 2;
                b.y += ny * overlap / 2;

                if (relativeSpeed < 0) {
                    const massA = Math.max(1, a.radius ** 2);
                    const massB = Math.max(1, b.radius ** 2);
                    const impulse = 2 * relativeSpeed / (massA + massB);
                    a.vx += impulse * massB * nx;
                    a.vy += impulse * massB * ny;
                    b.vx -= impulse * massA * nx;
                    b.vy -= impulse * massA * ny;
                }
            }
        }
    };

    const drawChamber = () => {
        const bounds = chamberBounds();
        const chamberWidth = bounds.right - bounds.left;
        const chamberHeight = bounds.bottom - bounds.top;

        context.clearRect(0, 0, width, height);
        context.fillStyle = 'rgba(255, 255, 255, 0.018)';
        context.fillRect(bounds.left, bounds.top, chamberWidth, chamberHeight);
        context.strokeStyle = 'rgba(255, 215, 225, 0.55)';
        context.lineWidth = 2;
        context.strokeRect(bounds.left, bounds.top, bounds.outerRight - bounds.left, chamberHeight);
        context.save();
        context.beginPath();
        context.rect(bounds.left, bounds.top, chamberWidth, chamberHeight);
        context.clip();

        if (dividerClosed && ['diffusion', 'heat', 'brownian'].includes(config.mode)) {
            context.setLineDash([9, 7]);
            context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            context.lineWidth = 3;
            context.beginPath();
            const midpoint = (bounds.left + bounds.right) / 2;
            context.moveTo(midpoint, bounds.top);
            context.lineTo(midpoint, bounds.bottom);
            context.stroke();
            context.setLineDash([]);
        }

        if (config.mode === 'pressure' || config.mode === 'gaslaw') {
            context.strokeStyle = '#36a9ff';
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(bounds.right, bounds.top);
            context.lineTo(bounds.right, bounds.bottom);
            context.stroke();
        }

        if (config.mode === 'atoms' && bondsFormed) {
            const atomsByPair = new Map();
            particles.forEach((particle) => {
                if (!atomsByPair.has(particle.pair)) atomsByPair.set(particle.pair, []);
                atomsByPair.get(particle.pair).push(particle);
            });
            context.lineWidth = 2;
            atomsByPair.forEach((pair) => {
                if (pair.length !== 2) return;
                context.beginPath();
                context.moveTo(pair[0].x, pair[0].y);
                context.lineTo(pair[1].x, pair[1].y);
                context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                context.stroke();
            });
        }

        if (config.mode === 'thermometer' || config.mode === 'absolute' || config.mode === 'phasechange') {
            const gaugeX = bounds.left + 18;
            const gaugeTop = bounds.top + 26;
            const gaugeHeight = Math.min(170, (bounds.bottom - bounds.top) * 0.52);
            const range = Number(temperatureInput.max) - Number(temperatureInput.min);
            const level = range ? (currentTemperature - Number(temperatureInput.min)) / range : 0;
            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.fillRect(gaugeX, gaugeTop, 12, gaugeHeight);
            context.fillStyle = '#ff465d';
            context.fillRect(gaugeX, gaugeTop + gaugeHeight * (1 - level), 12, gaugeHeight * level);
            context.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            context.lineWidth = 1;
            context.strokeRect(gaugeX, gaugeTop, 12, gaugeHeight);
        }

        if (config.mode === 'compare') {
            const midpoint = (bounds.left + bounds.right) / 2;
            context.setLineDash([8, 8]);
            context.strokeStyle = 'rgba(255, 215, 225, 0.5)';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(midpoint, bounds.top);
            context.lineTo(midpoint, bounds.bottom);
            context.stroke();
            context.setLineDash([]);
            context.font = '600 14px Segoe UI, Arial, sans-serif';
            context.textAlign = 'center';
            context.fillStyle = '#ffd8df';
            context.fillText('ҚАТТЫ ДЕНЕ', (bounds.left + midpoint) / 2, bounds.top + 20);
            context.fillStyle = '#9dd7ff';
            context.fillText('СҰЙЫҚ', (midpoint + bounds.right) / 2, bounds.top + 20);
        }

        particles.forEach((particle) => {
            const glow = context.createRadialGradient(
                particle.x - particle.radius * 0.35,
                particle.y - particle.radius * 0.35,
                1,
                particle.x,
                particle.y,
                particle.radius * 3
            );
            glow.addColorStop(0, '#ffffff');
            glow.addColorStop(0.25, colors[particle.color]);
            glow.addColorStop(1, `${colors[particle.color]}00`);
            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
            context.fillStyle = glow;
            context.fill();
        });

        if (config.mode === 'mkt') {
            context.strokeStyle = 'rgba(255, 246, 184, 0.82)';
            context.fillStyle = 'rgba(255, 246, 184, 0.9)';
            context.lineWidth = 2;
            particles.filter((particle, index) => index % 5 === 0).forEach((particle) => {
                const speed = Math.hypot(particle.vx, particle.vy) || 1;
                const endX = particle.x + particle.vx / speed * 24;
                const endY = particle.y + particle.vy / speed * 24;
                context.beginPath();
                context.moveTo(particle.x, particle.y);
                context.lineTo(endX, endY);
                context.stroke();
                context.beginPath();
                context.arc(endX, endY, 2.5, 0, Math.PI * 2);
                context.fill();
            });
        }

        if (config.mode === 'phasechange') {
            const barWidth = Math.min(300, bounds.right - bounds.left - 48);
            const barX = bounds.left + (bounds.right - bounds.left - barWidth) / 2;
            const barY = bounds.bottom - 18;
            const segmentWidth = barWidth / 3;
            const phaseColors = ['#7bbcff', '#ffd46d', '#ff596b'];
            phaseColors.forEach((color, index) => {
                context.fillStyle = color;
                context.globalAlpha = index === aggregatePhase ? 0.95 : 0.28;
                context.fillRect(barX + index * segmentWidth, barY, segmentWidth - 2, 8);
            });
            context.globalAlpha = 1;
            context.fillStyle = '#f5e5e6';
            context.font = '12px Segoe UI, Arial, sans-serif';
            context.textAlign = 'left';
            context.fillText('Қатты', barX, barY - 5);
            context.textAlign = 'center';
            context.fillText('Балқу', barX + segmentWidth * 1.5, barY - 5);
            context.textAlign = 'right';
            context.fillText('Газ', barX + barWidth, barY - 5);
        }

        if (config.mode === 'internal') {
            const centerY = (bounds.top + bounds.bottom) / 2;
            context.strokeStyle = workApplied ? '#36a9ff' : '#ffb84d';
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(bounds.left + 16, centerY);
            context.lineTo(bounds.left + 78, centerY);
            context.stroke();
            context.fillStyle = workApplied ? '#36a9ff' : '#ffb84d';
            context.beginPath();
            context.arc(bounds.left + 78, centerY, 8, 0, Math.PI * 2);
            context.fill();
            context.font = '12px Segoe UI, Arial, sans-serif';
            context.textAlign = 'left';
            context.fillText(workApplied ? 'Сыртқы жұмыс' : 'Жылу берілуі', bounds.left + 14, centerY - 14);
        }

        if (config.mode === 'thermo') {
            const engineX = (bounds.left + bounds.right) / 2;
            const engineY = (bounds.top + bounds.bottom) / 2;
            const reservoirWidth = Math.min(110, (bounds.right - bounds.left) * 0.22);
            context.fillStyle = 'rgba(255, 80, 90, 0.2)';
            context.fillRect(bounds.left + 8, engineY - 30, reservoirWidth, 60);
            context.fillStyle = 'rgba(54, 169, 255, 0.2)';
            context.fillRect(bounds.right - reservoirWidth - 8, engineY - 30, reservoirWidth, 60);
            context.strokeStyle = '#ff6a73';
            context.lineWidth = 3;
            context.strokeRect(bounds.left + 8, engineY - 30, reservoirWidth, 60);
            context.strokeStyle = '#36a9ff';
            context.strokeRect(bounds.right - reservoirWidth - 8, engineY - 30, reservoirWidth, 60);
            context.fillStyle = '#ffe5e8';
            context.font = '12px Segoe UI, Arial, sans-serif';
            context.textAlign = 'center';
            context.fillText('Қыздырғыш', bounds.left + reservoirWidth / 2 + 8, engineY + 48);
            context.fillText('Суытқыш', bounds.right - reservoirWidth / 2 - 8, engineY + 48);
            context.fillStyle = '#ffd46d';
            context.beginPath();
            context.arc(engineX, engineY, 28, 0, Math.PI * 2);
            context.fill();
            context.fillStyle = '#1b090d';
            context.fillText('Q → A', engineX, engineY + 4);
        }
        context.restore();
    };

    const animate = (time) => {
        if (!open) return;
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.035) : 0;
        previousTime = time;

        if (!paused && width && height) {
            particles.forEach((particle, index) => {
                if (config.mode === 'compare' && particle.sample === 'solid') {
                    const vibration = currentTemperature * 0.18;
                    particle.x = particle.homeX + Math.sin(time * 0.003 + index) * vibration;
                    particle.y = particle.homeY + Math.cos(time * 0.003 + index * 1.3) * vibration;
                    return;
                }
                const oldX = particle.x;
                particle.x += particle.vx * delta;
                particle.y += particle.vy * delta;
                collideWithWalls(particle, oldX);
            });
            collideParticles();
            updateCounts();
        }

        drawChamber();
        animationId = window.requestAnimationFrame(animate);
    };

    const openLab = async () => {
        open = true;
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        if (!particles.length) resetParticles();
        drawChamber();
        previousTime = 0;
        animationId = window.requestAnimationFrame(animate);

        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch {
                overlay.classList.add('is-open');
            }
        }
    };

    const closeLab = async () => {
        open = false;
        window.cancelAnimationFrame(animationId);
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
        }
    };

    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });

    dividerButton.addEventListener('click', () => {
        if (config.mode === 'diffusion' || config.mode === 'heat' || config.mode === 'brownian') {
            dividerClosed = !dividerClosed;
            dividerButton.textContent = dividerClosed
                ? (config.mode === 'heat' ? 'Жылу беруді бастау' : 'Бөлгішті ашу')
                : 'Бөлгішті жабу';
            status.textContent = dividerClosed
                ? 'Бөлгіш жабық. Бөлшектер екі жақта қозғалады.'
                : config.mode === 'heat'
                    ? 'Жылу алмасу басталды. Жылдам бөлшектер энергиясын баяуларына береді.'
                    : config.mode === 'brownian'
                        ? 'Бөлшектер еркін қозғалып, броундық бөлшекке жан-жақтан соқтығысады.'
                        : 'Бөлгіш ашық. Бөлшектер екі жаққа таралып, араласады.';
        } else if (config.mode === 'states' || config.mode === 'structure') {
            const minValue = Number(temperatureInput.min);
            const maxValue = Number(temperatureInput.max);
            const increment = Math.max(Number(temperatureInput.step), Math.round((maxValue - minValue) / 3));
            const nextTemperature = currentTemperature + increment > maxValue ? minValue : currentTemperature + increment;
            temperatureInput.value = nextTemperature;
            temperatureInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (config.mode === 'phasechange') {
            const minValue = Number(temperatureInput.min);
            const maxValue = Number(temperatureInput.max);
            const nextTemperature = currentTemperature >= maxValue
                ? minValue
                : Math.min(maxValue, currentTemperature + Number(temperatureInput.step));
            temperatureInput.value = nextTemperature;
            temperatureInput.dispatchEvent(new Event('input', { bubbles: true }));
            status.textContent = `Қыздыру: ${currentTemperature} °C. ${phaseDescription()}`;
        } else if (config.mode === 'compare') {
            resetParticles();
            status.textContent = 'Екі үлгі жаңадан орналастырылды. Қатты денедегі тербелісті сұйықтағы еркін қозғалыспен салыстыр.';
            drawChamber();
        } else if (config.mode === 'mkt') {
            collisionCount = 0;
            dividerButton.textContent = 'Санауды қайта бастау';
            status.textContent = 'Соқтығысу санағы нөлденді. Бағыт көрсеткіштері арқылы бөлшектер қозғалысын бақыла.';
            updateCounts();
        } else if (config.mode === 'motion') {
            particles.forEach((particle) => {
                particle.vx *= 1.5;
                particle.vy *= 1.5;
            });
            status.textContent = 'Импульс берілді. Бөлшектер жылдамырақ қозғалып жатыр.';
            dividerButton.textContent = 'Тағы импульс беру';
            updateCounts();
        } else if (config.mode === 'atoms') {
            bondsFormed = !bondsFormed;
            dividerButton.textContent = bondsFormed ? 'Молекуланы ажырату' : 'Атомдарды біріктіру';
            status.textContent = bondsFormed
                ? 'Атомдар химиялық байланыс арқылы молекула моделін құрады.'
                : 'Атомдар ажыратылды. Қайта біріктіріп көр.';
            updateCounts();
            drawChamber();
        } else if (config.mode === 'internal') {
            workApplied = !workApplied;
            const nextTemperature = Math.min(Number(temperatureInput.max), currentTemperature + 1);
            temperatureInput.value = nextTemperature;
            temperatureInput.dispatchEvent(new Event('input', { bubbles: true }));
            status.textContent = workApplied
                ? 'Жұмыс істеу арқылы энергия артты. Бөлшектер қозғалысы күшейді.'
                : 'Жылу беру арқылы энергия артты. Бөлшектер қозғалысы күшейді.';
            dividerButton.textContent = workApplied ? 'Жылу беру' : 'Жұмыс істеу';
        } else if (config.mode === 'thermometer') {
            status.textContent = `Термометр көрсеткіші: ${currentTemperature} °C. Бөлшектердің жылдамдығын температурамен салыстыр.`;
            updateCounts();
        } else if (config.mode === 'amount') {
            const particleCount = (currentTemperature * 6.02214076e23).toExponential(2);
            status.textContent = `${currentTemperature} моль затта шамамен ${particleCount} бөлшек бар.`;
            updateCounts();
        } else if (config.mode === 'ideal') {
            particles.forEach((particle) => {
                particle.vx *= 1.25;
                particle.vy *= 1.25;
            });
            status.textContent = 'Орташа квадраттық жылдамдық артты; модель бойынша газ қысымы да артады.';
            dividerButton.textContent = 'Жылдамдықты тағы арттыру';
            updateCounts();
        } else if (config.mode === 'thermo') {
            const work = currentTemperature * 10 * (config.efficiency ?? 0.35);
            status.textContent = `Қозғалтқыш бір циклде ${work.toFixed(1)} кДж жұмыс атқарды. Қалған жылу суытқышқа берілді.`;
            dividerButton.textContent = 'Келесі цикл';
            updateCounts();
        } else if (config.mode === 'pressure' || config.mode === 'gaslaw') {
            pistonCompressed = !pistonCompressed;
            if (pistonCompressed) {
                const bounds = chamberBounds();
                particles.forEach((particle) => {
                    if (particle.x > bounds.right - particle.radius) {
                        particle.x = bounds.right - particle.radius;
                        particle.vx = -Math.abs(particle.vx);
                    }
                });
            }
            dividerButton.textContent = pistonCompressed ? 'Поршеньді босату' : 'Поршеньді сығу';
            status.textContent = pistonCompressed
                ? 'Көлем азайды. Қабырғаға соқтығысу жиілігі мен салыстырмалы қысым артты.'
                : 'Поршень босатылды. Газ бастапқы көлемге қайта жайылды.';
            updateCounts();
        }
    });

    pauseButton.addEventListener('click', () => {
        paused = !paused;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Тоқтату';
    });

    resetButton.addEventListener('click', () => {
        if (config.initialTemperature !== undefined) {
            currentTemperature = Number(config.initialTemperature);
            temperatureInput.value = currentTemperature;
            temperatureValue.value = currentTemperature;
            temperatureValue.textContent = `${currentTemperature} ${config.inputUnit || ''}`.trim();
        }
        if (phaseModes.includes(config.mode)) {
            aggregatePhase = getPhase();
        }
        resetParticles();
        drawChamber();
    });

    temperatureInput.addEventListener('input', () => {
        const previousSpeed = speedForTemperature(currentTemperature);
        currentTemperature = Number(temperatureInput.value);
        temperatureValue.value = temperatureInput.value;
        temperatureValue.textContent = `${temperatureInput.value} ${config.inputUnit || ''}`.trim();
        const nextSpeed = speedForTemperature(currentTemperature);
        const scale = previousSpeed ? nextSpeed / previousSpeed : 0;

        if (phaseModes.includes(config.mode)) {
            const nextPhase = getPhase();
            if (nextPhase !== aggregatePhase) {
                aggregatePhase = nextPhase;
                resetParticles();
                drawChamber();
                return;
            }
        }

        particles.forEach((particle) => {
            particle.vx *= scale;
            particle.vy *= scale;
        });
        if (config.mode === 'states' || config.mode === 'structure') status.textContent = phaseDescription();
        if (config.mode === 'phasechange') status.textContent = `Температура: ${currentTemperature} °C. ${phaseDescription()}`;
        if (config.mode === 'thermometer') status.textContent = `Термометр көрсеткіші: ${currentTemperature} °C.`;
        if (config.mode === 'absolute') status.textContent = `Абсолют температура: ${currentTemperature} K.`;
        if (config.mode === 'internal') status.textContent = `Ішкі энергия деңгейі өзгерді: ${currentTemperature}.`;
        updateCounts();
        drawChamber();
    });

    window.addEventListener('resize', resizeCanvas);
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && open) closeLab();
        resizeCanvas();
    });
    resizeCanvas();
}

function initializeEvaporationLab(elements) {
    const { overlay, canvas, openButton, closeButton, context, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('evaporationLabControls');
    const standardControls = document.getElementById('standardLabControls');
    const controlIds = [
        'iceMeltingControls', 'diffusionLabControls', 'brownianLabControls',
        'heatExchangeControls', 'combustionLabControls'
    ];
    const dryInput = document.getElementById('dryBulbTemperature');
    const wetInput = document.getElementById('wetBulbTemperature');
    const tableToggle = document.getElementById('psychrometricTableToggle');
    const tableWrap = document.getElementById('psychrometricTableWrap');
    const tableBody = document.getElementById('psychrometricTableBody');
    const startButton = document.getElementById('evaporationStart');
    const pauseButton = document.getElementById('evaporationPause');
    const resetButton = document.getElementById('evaporationReset');
    const status = document.getElementById('evaporationStatus');
    const result = document.getElementById('evaporationResult');
    const duration = 9000;
    let width = 0;
    let height = 0;
    let progress = 0;
    let running = false;
    let paused = false;
    let startedAt = 0;
    let pausedAt = 0;
    let frameId = 0;
    let measuredValues = null;

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = 'Виртуалды зертхана • 8-сынып';
    canvas.setAttribute('aria-label', 'Булану салдарынан дымқыл термометрдің салқындауын және психрометрді көрсететін модель');
    standardControls.classList.add('hidden');
    controlIds.forEach((id) => document.getElementById(id).classList.add('hidden'));
    controls.classList.remove('hidden');
    document.getElementById('labLegend').classList.add('hidden');
    labWindow.classList.add('is-evaporation-lab');
    tableWrap.classList.toggle('hidden', !tableToggle.checked);

    const saturationPressure = (temperature) => {
        const exponent = temperature < 0
            ? (22.452 * temperature) / (272.55 + temperature)
            : (17.62 * temperature) / (243.12 + temperature);
        return 0.6112 * Math.exp(exponent);
    };

    const calculateHumidity = (dryTemperature, wetTemperature) => {
        const vaporPressure = saturationPressure(wetTemperature)
            - 0.00066 * (1 + 0.00115 * wetTemperature) * 101.325 * (dryTemperature - wetTemperature);
        return Math.max(0, Math.min(100, 100 * vaporPressure / saturationPressure(dryTemperature)));
    };

    const updateTable = () => {
        const dryTemperature = Number(dryInput.value);
        if (!Number.isFinite(dryTemperature)) return;
        tableBody.replaceChildren();
        [0, 2, 4, 6, 8, 10].forEach((depression) => {
            const wetTemperature = dryTemperature - depression;
            const row = document.createElement('tr');
            const differenceCell = document.createElement('td');
            const humidityCell = document.createElement('td');
            differenceCell.textContent = String(depression);
            humidityCell.textContent = `${Math.round(calculateHumidity(dryTemperature, wetTemperature))}%`;
            row.append(differenceCell, humidityCell);
            tableBody.append(row);
        });
    };

    const readValues = () => ({
        dryTemperature: Number(dryInput.value),
        wetTemperature: Number(wetInput.value)
    });

    const validate = () => {
        [dryInput, wetInput].forEach((field) => field.setCustomValidity(''));
        if (!dryInput.reportValidity() || !wetInput.reportValidity()) return false;
        const values = readValues();
        if (!Number.isFinite(values.dryTemperature) || !Number.isFinite(values.wetTemperature)) return false;
        if (values.wetTemperature > values.dryTemperature) {
            wetInput.setCustomValidity('Дымқыл термометрдің температурасы құрғақ термометрден жоғары болмауы керек.');
            wetInput.reportValidity();
            return false;
        }
        return true;
    };

    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        dryInput.disabled = running;
        wetInput.disabled = running;
    };

    const drawThermometer = (x, y, thermometerHeight, temperature, label) => {
        const tubeWidth = Math.max(12, width * 0.016);
        const tubeTop = y + 18;
        const tubeBottom = y + thermometerHeight - 20;
        const level = Math.max(0, Math.min(1, temperature / 40));
        context.fillStyle = 'rgba(230,240,255,0.12)';
        context.strokeStyle = '#7ca8e5';
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(x - tubeWidth * 1.4, y, tubeWidth * 2.8, thermometerHeight, 10);
        context.fill();
        context.stroke();
        context.fillStyle = '#11284a';
        context.fillRect(x - 3, tubeTop, 6, tubeBottom - tubeTop);
        context.fillStyle = '#ff526e';
        context.fillRect(x - 3, tubeBottom - (tubeBottom - tubeTop) * level, 6, (tubeBottom - tubeTop) * level);
        context.beginPath();
        context.arc(x, tubeBottom + 2, tubeWidth * 0.75, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#e4efff';
        context.textAlign = 'center';
        context.font = `600 ${Math.max(14, width * 0.016)}px Segoe UI, Arial, sans-serif`;
        context.fillText(label, x, y - 10);
        context.fillText(`${temperature.toFixed(1)} °C`, x, y + thermometerHeight + 22);
        context.textAlign = 'left';
        for (let mark = 0; mark <= 40; mark += 10) {
            const markY = tubeBottom - (tubeBottom - tubeTop) * mark / 40;
            context.fillStyle = '#b7d7ff';
            context.fillRect(x + tubeWidth, markY, tubeWidth * 0.7, 2);
            context.font = '12px Segoe UI, Arial, sans-serif';
            context.fillText(String(mark), x + tubeWidth * 1.9, markY + 4);
        }
    };

    const drawScene = (time = 0) => {
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        const background = context.createLinearGradient(0, 0, 0, height);
        background.addColorStop(0, '#102748');
        background.addColorStop(0.65, '#0b1a33');
        background.addColorStop(1, '#17395b');
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
        context.textAlign = 'center';
        context.fillStyle = '#b7d7ff';
        context.font = `700 ${Math.max(19, Math.min(32, width * 0.034))}px Segoe UI, Arial, sans-serif`;
        context.fillText('СУДЫҢ БУЛАНУЫ ЖӘНЕ АУА ЫЛҒАЛДЫЛЫҒЫ', width / 2, height * 0.09);

        const values = measuredValues || readValues();
        const dryTemperature = values.dryTemperature;
        const wetTemperature = measuredValues
            ? dryTemperature + (values.wetTemperature - dryTemperature) * progress
            : values.wetTemperature;
        drawThermometer(width * 0.28, height * 0.25, height * 0.43, dryTemperature, 'Құрғақ термометр');
        drawThermometer(width * 0.53, height * 0.25, height * 0.43, wetTemperature, 'Дымқыл термометр');

        const beakerWidth = Math.min(width * 0.38, 300);
        const beakerLeft = width * 0.68 - beakerWidth / 2;
        const beakerTop = height * 0.43;
        const beakerBottom = height * 0.82;
        context.fillStyle = 'rgba(52, 148, 220, 0.7)';
        context.fillRect(beakerLeft + 10, beakerTop + (beakerBottom - beakerTop) * 0.38, beakerWidth - 20, (beakerBottom - beakerTop) * 0.62);
        context.strokeStyle = '#83b9ef';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(beakerLeft, beakerTop);
        context.lineTo(beakerLeft, beakerBottom - 16);
        context.quadraticCurveTo(beakerLeft, beakerBottom, beakerLeft + 18, beakerBottom);
        context.lineTo(beakerLeft + beakerWidth - 18, beakerBottom);
        context.quadraticCurveTo(beakerLeft + beakerWidth, beakerBottom, beakerLeft + beakerWidth, beakerBottom - 16);
        context.lineTo(beakerLeft + beakerWidth, beakerTop);
        context.stroke();
        context.beginPath();
        context.ellipse(beakerLeft + beakerWidth / 2, beakerTop, beakerWidth / 2, 12, 0, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = '#d4e4ff';
        context.font = '600 16px Segoe UI, Arial, sans-serif';
        context.textAlign = 'center';
        context.fillText('Су · булану', beakerLeft + beakerWidth / 2, beakerBottom + 25);

        const vaporOpacity = measuredValues ? 0.35 + progress * 0.6 : 0.28;
        context.fillStyle = `rgba(185, 222, 255, ${vaporOpacity})`;
        const vaporTime = running && !paused ? time : 0;
        for (let index = 0; index < 7; index += 1) {
            const drift = running && !paused ? Math.sin(vaporTime / 500 + index) * 8 : 0;
            const vaporX = beakerLeft + beakerWidth * (0.25 + index % 4 * 0.16) + drift;
            const vaporY = beakerTop - 18 - ((vaporTime / 25 + index * 19) % 46);
            context.beginPath();
            context.arc(vaporX, vaporY, 3 + index % 3, 0, Math.PI * 2);
            context.fill();
        }

        context.fillStyle = '#ffafc0';
        context.font = '600 15px Segoe UI, Arial, sans-serif';
        context.fillText(
            progress >= 1 ? 'Өлшеу аяқталды'
                : running ? 'Судың булануы дымқыл термометрді салқындатады'
                    : 'Дымқыл термометр көрсеткішін бақыла',
            width / 2, height * 0.16
        );
    };

    const resizeCanvas = () => {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        drawScene();
    };

    const animate = (time) => {
        if (running && !paused) {
            progress = Math.min(1, (time - startedAt) / duration);
            if (progress === 1) {
                running = false;
                updateControls();
                const humidity = calculateHumidity(measuredValues.dryTemperature, measuredValues.wetTemperature);
                status.textContent = 'Булану нәтижесінде дымқыл термометр құрғақ термометрден төмен температура көрсетті.';
                result.textContent = `Ауаның салыстырмалы ылғалдылығы: ${Math.round(humidity)}% · температура айырмасы: ${(measuredValues.dryTemperature - measuredValues.wetTemperature).toFixed(1)} °C`;
            }
        }
        drawScene(time);
        if (running && !paused && overlay.classList.contains('is-open')) {
            frameId = window.requestAnimationFrame(animate);
        }
    };

    const openLab = async () => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        window.cancelAnimationFrame(frameId);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };

    const closeLab = async () => {
        if (running && !paused) {
            pausedAt = performance.now();
            paused = true;
            updateControls();
        }
        window.cancelAnimationFrame(frameId);
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };

    const refreshInputValues = () => {
        if (!running) {
            measuredValues = null;
            progress = 0;
            result.textContent = 'Ауаның салыстырмалы ылғалдылығы: —';
            status.textContent = 'Психрометр көрсеткіштерін енгізіп, тәжірибені баста.';
        }
        updateTable();
        drawScene();
    };

    startButton.addEventListener('click', () => {
        if (!validate()) return;
        measuredValues = readValues();
        progress = 0;
        paused = false;
        running = true;
        startedAt = performance.now();
        status.textContent = 'Судың булануы дымқыл термометрді салқындатып жатыр.';
        result.textContent = 'Ауаның салыстырмалы ылғалдылығы есептелуде…';
        updateControls();
        drawScene();
        frameId = window.requestAnimationFrame(animate);
    });

    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            startedAt += performance.now() - pausedAt;
            paused = false;
            frameId = window.requestAnimationFrame(animate);
        } else {
            pausedAt = performance.now();
            paused = true;
            window.cancelAnimationFrame(frameId);
        }
        updateControls();
        drawScene(performance.now());
    });

    resetButton.addEventListener('click', () => {
        running = false;
        paused = false;
        window.cancelAnimationFrame(frameId);
        progress = 0;
        measuredValues = null;
        status.textContent = 'Психрометр көрсеткіштерін енгізіп, тәжірибені баста.';
        result.textContent = 'Ауаның салыстырмалы ылғалдылығы: —';
        updateControls();
        drawScene();
    });

    [dryInput, wetInput].forEach((field) => {
        field.addEventListener('input', refreshInputValues);
        field.addEventListener('change', refreshInputValues);
    });
    tableToggle.addEventListener('change', () => {
        tableWrap.classList.toggle('hidden', !tableToggle.checked);
        tableToggle.setAttribute('aria-expanded', String(tableToggle.checked));
    });
    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    window.addEventListener('resize', resizeCanvas);
    updateControls();
    updateTable();
    resizeCanvas();
}

function initializeCombustionLab(elements) {
    const { overlay, canvas, openButton, closeButton, context, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('combustionLabControls');
    const controlIds = ['standardLabControls', 'iceMeltingControls', 'diffusionLabControls', 'brownianLabControls', 'heatExchangeControls'];
    const legend = document.getElementById('labLegend');
    const startButton = document.getElementById('combustionStart');
    const pauseButton = document.getElementById('combustionPause');
    const resetButton = document.getElementById('combustionReset');
    const status = document.getElementById('combustionStatus');
    const result = document.getElementById('combustionResult');
    const heatCapacityLabel = document.getElementById('combustionHeatCapacity');
    const liquidSelect = document.getElementById('combustionLiquid');
    const fuelSelect = document.getElementById('combustionFuel');
    const fields = {
        initialTemperature: document.getElementById('combustionInitialTemperature'),
        volume: document.getElementById('combustionVolume'),
        initialFuelMass: document.getElementById('combustionFuelInitialMass'),
        remainingFuelMass: document.getElementById('combustionFuelRemainingMass')
    };
    const liquids = {
        water: { label: 'Су', heatCapacity: 4200, density: 1000 },
        milk: { label: 'Сүт', heatCapacity: 3900, density: 1030 },
        benzene: { label: 'Бензол', heatCapacity: 1700, density: 880 },
        turpentine: { label: 'Скипидар', heatCapacity: 1800, density: 870 },
        glycerin: { label: 'Глицерин', heatCapacity: 2400, density: 1260 }
    };
    const fuels = {
        wood: { label: 'Ағаш', heat: 10_000_000 },
        brownCoal: { label: 'Қоңыр көмір', heat: 15_000_000 },
        peat: { label: 'Шымтезек', heat: 15_000_000 },
        coal: { label: 'Тас көмір', heat: 27_000_000 },
        anthracite: { label: 'Антрацит', heat: 30_000_000 }
    };
    const calorimeterHeatCapacity = 100;
    const duration = 12000;
    let width = 0;
    let height = 0;
    let progress = 0;
    let running = false;
    let paused = false;
    let startedAt = 0;
    let pausedAt = 0;
    let frameId = 0;
    let finalTemperature = null;
    let initialTemperature = Number(fields.initialTemperature.value);
    let experimentResults = null;

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = `Виртуалды зертхана • ${new URLSearchParams(window.location.search).get('grade') || '8'}-сынып`;
    if (config.instructions) {
        controls.querySelector('.lab-instructions').textContent = config.instructions;
    }
    canvas.setAttribute('aria-label', 'Отын жанғанда калориметрдегі сұйықтың қызуын көрсететін модель');
    controlIds.forEach((id) => document.getElementById(id).classList.add('hidden'));
    controls.classList.remove('hidden');
    legend.classList.add('hidden');
    labWindow.classList.add('is-combustion-lab');

    const getValues = () => Object.fromEntries(
        Object.entries(fields).map(([name, field]) => [name, Number(field.value)])
    );

    const updateHeatCapacityLabel = () => {
        const liquid = liquids[liquidSelect.value];
        heatCapacityLabel.textContent = `Таңдалған сұйықтың меншікті жылусыйымдылығы: c = ${liquid.heatCapacity} Дж/(кг·°C)`;
    };

    const validate = () => {
        let valid = true;
        Object.values(fields).forEach((field) => {
            field.setCustomValidity('');
            field.required = true;
            if (!field.reportValidity()) valid = false;
        });
        if (!valid) return false;
        const values = getValues();
        if (!Object.values(values).every(Number.isFinite)) return false;
        if (values.remainingFuelMass >= values.initialFuelMass) {
            fields.remainingFuelMass.setCustomValidity('Жанғаннан кейінгі масса бастапқы массадан аз болуы керек.');
            fields.remainingFuelMass.reportValidity();
            return false;
        }
        const liquid = liquids[liquidSelect.value];
        const fuel = fuels[fuelSelect.value];
        const liquidMass = values.volume * liquid.density / 1000;
        const burnedMass = values.initialFuelMass - values.remainingFuelMass;
        const finalTemperature = values.initialTemperature
            + burnedMass * fuel.heat / (liquidMass * liquid.heatCapacity + calorimeterHeatCapacity);
        if (finalTemperature > 100) {
            fields.remainingFuelMass.setCustomValidity('Сұйықты қайнатпай өлшеу үшін жанған отын мөлшерін азайтыңыз.');
            fields.remainingFuelMass.reportValidity();
            return false;
        }
        return true;
    };

    const calculate = () => {
        const values = getValues();
        const liquid = liquids[liquidSelect.value];
        const fuel = fuels[fuelSelect.value];
        const liquidMass = values.volume * liquid.density / 1000;
        const burnedMass = values.initialFuelMass - values.remainingFuelMass;
        const gainedHeat = burnedMass * fuel.heat;
        const totalHeatCapacity = liquidMass * liquid.heatCapacity + calorimeterHeatCapacity;
        return {
            temperature: values.initialTemperature + gainedHeat / totalHeatCapacity,
            specificHeat: gainedHeat / burnedMass,
            burnedMass,
            liquidMass,
            liquid,
            fuel
        };
    };

    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        [...Object.values(fields), liquidSelect, fuelSelect].forEach((field) => { field.disabled = running; });
    };

    const drawThermometer = (x, y, thermometerHeight, temperature) => {
        const tubeWidth = Math.max(12, width * 0.016);
        const tubeTop = y + 18;
        const tubeBottom = y + thermometerHeight - 20;
        const fraction = Math.max(0, Math.min(1, temperature / 120));
        context.fillStyle = 'rgba(230,240,255,0.12)';
        context.strokeStyle = '#7ca8e5';
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(x - tubeWidth * 1.4, y, tubeWidth * 2.8, thermometerHeight, 10);
        context.fill();
        context.stroke();
        context.fillStyle = '#11284a';
        context.fillRect(x - 3, tubeTop, 6, tubeBottom - tubeTop);
        context.fillStyle = '#ff526e';
        context.fillRect(x - 3, tubeBottom - (tubeBottom - tubeTop) * fraction, 6, (tubeBottom - tubeTop) * fraction);
        context.beginPath();
        context.arc(x, tubeBottom + 2, tubeWidth * 0.75, 0, Math.PI * 2);
        context.fillStyle = '#ff526e';
        context.fill();
        context.strokeStyle = '#ff9bb0';
        context.stroke();
        context.fillStyle = '#e4efff';
        context.textAlign = 'center';
        context.font = `600 ${Math.max(14, width * 0.016)}px Segoe UI, Arial, sans-serif`;
        context.fillText(`${temperature.toFixed(1)} °C`, x, y + thermometerHeight + 22);
    };

    const drawScene = () => {
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        const background = context.createLinearGradient(0, 0, 0, height);
        background.addColorStop(0, '#102748');
        background.addColorStop(0.58, '#0b1a33');
        background.addColorStop(1, '#2b1235');
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
        context.textAlign = 'center';
        context.fillStyle = '#b7d7ff';
        context.font = `700 ${Math.max(20, Math.min(34, width * 0.036))}px Segoe UI, Arial, sans-serif`;
        context.fillText('ОТЫННЫҢ МЕНШІКТІ ЖАНУ ЖЫЛУЫН АНЫҚТАУ', width / 2, height * 0.075);
        const values = getValues();
        const resultValues = finalTemperature === null ? null : calculate();
        const temperature = resultValues
            ? initialTemperature + (finalTemperature - initialTemperature) * progress
            : Number(fields.initialTemperature.value);
        drawThermometer(width * 0.17, height * 0.23, height * 0.48, temperature);

        const cupWidth = width * 0.32;
        const cupLeft = (width - cupWidth) / 2;
        const cupTop = height * 0.34;
        const cupBottom = height * 0.82;
        const liquidTop = cupBottom - (cupBottom - cupTop) * (0.32 + progress * 0.05);
        context.fillStyle = 'rgba(58,157,231,0.68)';
        context.fillRect(cupLeft + 10, liquidTop, cupWidth - 20, cupBottom - liquidTop);
        context.beginPath();
        context.ellipse(width / 2, liquidTop, cupWidth / 2 - 10, 12, 0, 0, Math.PI * 2);
        context.fillStyle = 'rgba(107,195,255,0.84)';
        context.fill();
        context.strokeStyle = '#83b9ef';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(cupLeft, cupTop);
        context.lineTo(cupLeft, cupBottom - 16);
        context.quadraticCurveTo(cupLeft, cupBottom, cupLeft + 18, cupBottom);
        context.lineTo(cupLeft + cupWidth - 18, cupBottom);
        context.quadraticCurveTo(cupLeft + cupWidth, cupBottom, cupLeft + cupWidth, cupBottom - 16);
        context.lineTo(cupLeft + cupWidth, cupTop);
        context.stroke();
        context.beginPath();
        context.ellipse(width / 2, cupTop, cupWidth / 2, 14, 0, 0, Math.PI * 2);
        context.stroke();

        const burnerTop = height * 0.83;
        const flameHeight = running ? 18 + Math.sin(performance.now() * 0.012) * 5 : 0;
        if (running) {
            context.beginPath();
            context.moveTo(width / 2 - 18, burnerTop);
            context.quadraticCurveTo(width / 2 - 10, burnerTop - flameHeight, width / 2, burnerTop - 4);
            context.quadraticCurveTo(width / 2 + 11, burnerTop - flameHeight, width / 2 + 18, burnerTop);
            context.fillStyle = 'rgba(255, 112, 78, 0.88)';
            context.fill();
        }
        context.fillStyle = '#17345a';
        context.fillRect(0, height * 0.94, width, height * 0.06);
        context.fillStyle = '#d4e4ff';
        context.font = `600 ${Math.max(14, width * 0.018)}px Segoe UI, Arial, sans-serif`;
        context.fillText(`Калориметр · ${liquids[liquidSelect.value].label} · ${values.volume.toFixed(1)} л`, width / 2, cupBottom + 26);
        context.fillStyle = '#ffafc0';
        context.font = `600 ${Math.max(15, width * 0.02)}px Segoe UI, Arial, sans-serif`;
        context.fillText(progress >= 1 ? 'Қыздыру аяқталды'
            : progress > 0 ? `${fuels[fuelSelect.value].label} жанып, сұйық қызуда`
                : 'Тәжірибе бастауға дайын', width / 2, height * 0.15);
        if (resultValues) {
            context.fillStyle = '#d4e4ff';
            context.font = `600 ${Math.max(13, width * 0.016)}px Segoe UI, Arial, sans-serif`;
            context.fillText(`Жанған отын: ${resultValues.burnedMass.toFixed(3)} кг`, width * 0.78, height * 0.48);
            context.fillText(`Тығыздық: ${resultValues.liquid.density} кг/м³`, width * 0.78, height * 0.53);
        }
    };

    const resizeCanvas = () => {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        drawScene();
    };

    const animate = (time) => {
        if (running && !paused) {
            progress = Math.min(1, (time - startedAt) / duration);
            if (progress === 1) {
                running = false;
                pauseButton.disabled = true;
                startButton.disabled = false;
                [...Object.values(fields), liquidSelect, fuelSelect].forEach((field) => { field.disabled = false; });
                status.textContent = 'Тәжірибе аяқталды. Өлшенген температурамен отынның меншікті жану жылуын есепте.';
                const measuredHeat = (experimentResults.liquidMass * experimentResults.liquid.heatCapacity + calorimeterHeatCapacity)
                    * (finalTemperature - initialTemperature);
                const measuredSpecificHeat = measuredHeat / experimentResults.burnedMass;
                result.textContent = `Соңғы температура: ${finalTemperature.toFixed(1)} °C · q = ${Math.round(measuredSpecificHeat).toLocaleString('kk-KZ')} Дж/кг`;
            }
        }
        drawScene();
        if (overlay.classList.contains('is-open')) frameId = window.requestAnimationFrame(animate);
    };

    const openLab = async () => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(animate);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };

    const closeLab = async () => {
        if (running && !paused) {
            pausedAt = performance.now();
            paused = true;
            updateControls();
        }
        window.cancelAnimationFrame(frameId);
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };

    startButton.addEventListener('click', () => {
        if (!validate()) return;
        const measured = calculate();
        experimentResults = measured;
        initialTemperature = Number(fields.initialTemperature.value);
        finalTemperature = measured.temperature;
        progress = 0;
        paused = false;
        running = true;
        startedAt = performance.now();
        status.textContent = `${measured.fuel.label} жанып, ${measured.liquid.label} қызуда. Термометрді бақыла.`;
        result.textContent = `Болжамды соңғы температура: ${finalTemperature.toFixed(1)} °C · жанған отын: ${measured.burnedMass.toFixed(3)} кг`;
        updateControls();
        drawScene();
    });

    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            startedAt += performance.now() - pausedAt;
            paused = false;
        } else {
            pausedAt = performance.now();
            paused = true;
        }
        updateControls();
    });

    resetButton.addEventListener('click', () => {
        running = false;
        paused = false;
        progress = 0;
        finalTemperature = null;
        experimentResults = null;
        initialTemperature = Number(fields.initialTemperature.value);
        status.textContent = 'Отын массасын өлшеп, тәжірибені баста.';
        result.textContent = 'Соңғы температура: — · q: —';
        updateControls();
        drawScene();
    });

    [...Object.values(fields), liquidSelect, fuelSelect].forEach((field) => field.addEventListener('input', drawScene));
    [...Object.values(fields), liquidSelect, fuelSelect].forEach((field) => field.addEventListener('change', drawScene));
    liquidSelect.addEventListener('change', updateHeatCapacityLabel);
    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    window.addEventListener('resize', resizeCanvas);
    updateControls();
    updateHeatCapacityLabel();
    resizeCanvas();
}

function initializeHeatExchangeLab(elements) {
    const { overlay, canvas, openButton, closeButton, context, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('heatExchangeControls');
    const standardControls = document.getElementById('standardLabControls');
    const iceControls = document.getElementById('iceMeltingControls');
    const diffusionControls = document.getElementById('diffusionLabControls');
    const brownianControls = document.getElementById('brownianLabControls');
    const legend = document.getElementById('labLegend');
    const startButton = document.getElementById('heatExchangeStart');
    const pauseButton = document.getElementById('heatExchangePause');
    const resetButton = document.getElementById('heatExchangeReset');
    const status = document.getElementById('heatExchangeStatus');
    const result = document.getElementById('heatExchangeResult');
    const fields = {
        hotVolume: document.getElementById('hotWaterVolume'),
        hotTemperature: document.getElementById('hotWaterTemperature'),
        calorimeterTemperature: document.getElementById('calorimeterInitialTemperature'),
        coldVolume: document.getElementById('coldWaterVolume'),
        coldTemperature: document.getElementById('coldWaterTemperature')
    };
    const waterHeatCapacity = 4200;
    const duration = 10000;
    let width = 0;
    let height = 0;
    let progress = 0;
    let running = false;
    let paused = false;
    let startedAt = 0;
    let pausedAt = 0;
    let frameId = 0;
    let equilibriumTemperature = null;
    let measuredTemperature = Number(fields.calorimeterTemperature.value);

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = `Виртуалды зертхана • ${new URLSearchParams(window.location.search).get('grade') || '8'}-сынып`;
    canvas.setAttribute('aria-label', 'Ыстық және салқын су араласқан калориметр мен термометрлер');
    standardControls.classList.add('hidden');
    iceControls.classList.add('hidden');
    diffusionControls.classList.add('hidden');
    brownianControls.classList.add('hidden');
    controls.classList.remove('hidden');
    legend.classList.add('hidden');
    labWindow.classList.add('is-heat-exchange-lab');

    const getValues = () => Object.fromEntries(
        Object.entries(fields).map(([name, field]) => [name, Number(field.value)])
    );

    const validate = () => {
        let valid = true;
        Object.values(fields).forEach((field) => {
            field.setCustomValidity('');
            field.required = true;
            if (!field.reportValidity()) valid = false;
        });
        if (!valid) return false;
        const values = getValues();
        if (!Object.values(values).every(Number.isFinite)) return false;
        if (values.hotTemperature <= values.coldTemperature) {
            fields.hotTemperature.setCustomValidity('Ыстық судың температурасы салқын судан жоғары болуы керек.');
            fields.hotTemperature.reportValidity();
            return false;
        }
        if (values.calorimeterTemperature > values.hotTemperature) {
            fields.calorimeterTemperature.setCustomValidity('Калориметрдің бастапқы температурасы ыстық судың температурасынан жоғары болмауы керек.');
            fields.calorimeterTemperature.reportValidity();
            return false;
        }
        return true;
    };

    const calculateEquilibrium = () => {
        const values = getValues();
        const hotMass = values.hotVolume;
        const coldMass = values.coldVolume;
        const calorimeterHeatCapacity = 100;
        return (
            hotMass * waterHeatCapacity * values.hotTemperature
            + coldMass * waterHeatCapacity * values.coldTemperature
            + calorimeterHeatCapacity * values.calorimeterTemperature
        ) / (
            (hotMass + coldMass) * waterHeatCapacity + calorimeterHeatCapacity
        );
    };

    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        Object.values(fields).forEach((field) => { field.disabled = running; });
    };

    const drawThermometer = (x, y, thermometerHeight, temperature, label) => {
        const tubeWidth = Math.max(12, width * 0.016);
        const tubeTop = y + 18;
        const tubeBottom = y + thermometerHeight - 20;
        const bulbRadius = tubeWidth * 0.75;
        const fraction = Math.max(0, Math.min(1, (temperature + 20) / 120));
        context.fillStyle = 'rgba(230,240,255,0.12)';
        context.strokeStyle = '#7ca8e5';
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(x - tubeWidth * 1.4, y, tubeWidth * 2.8, thermometerHeight, 10);
        context.fill();
        context.stroke();
        context.fillStyle = '#11284a';
        context.fillRect(x - 3, tubeTop, 6, tubeBottom - tubeTop);
        context.fillStyle = '#ff526e';
        context.fillRect(x - 3, tubeBottom - (tubeBottom - tubeTop) * fraction, 6, (tubeBottom - tubeTop) * fraction);
        context.beginPath();
        context.arc(x, tubeBottom + 2, bulbRadius, 0, Math.PI * 2);
        context.fillStyle = '#ff526e';
        context.fill();
        context.strokeStyle = '#ff9bb0';
        context.stroke();
        context.fillStyle = '#e4efff';
        context.textAlign = 'center';
        context.font = `600 ${Math.max(14, width * 0.016)}px Segoe UI, Arial, sans-serif`;
        context.fillText(`${temperature.toFixed(1)} °C`, x, y + thermometerHeight + 23);
        context.fillStyle = '#b7d7ff';
        context.font = `600 ${Math.max(15, width * 0.019)}px Segoe UI, Arial, sans-serif`;
        context.fillText(label, x, y - 10);
    };

    const drawScene = () => {
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        const background = context.createLinearGradient(0, 0, 0, height);
        background.addColorStop(0, '#102748');
        background.addColorStop(0.58, '#0b1a33');
        background.addColorStop(1, '#2b1235');
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);

        context.textAlign = 'center';
        context.fillStyle = '#b7d7ff';
        context.font = `700 ${Math.max(20, Math.min(34, width * 0.036))}px Segoe UI, Arial, sans-serif`;
        context.fillText('ЖЫЛУ АЛМАСУ ПРОЦЕСІ', width / 2, height * 0.075);

        const bounds = { top: height * 0.21, bottom: height * 0.82 };
        const thermometerHeight = (bounds.bottom - bounds.top) * 0.74;
        const thermometerTop = bounds.top + (bounds.bottom - bounds.top) * 0.1;
        const values = getValues();
        const hotTemperature = equilibriumTemperature === null
            ? values.hotTemperature
            : values.hotTemperature + (equilibriumTemperature - values.hotTemperature) * progress;
        const coldTemperature = equilibriumTemperature === null
            ? values.coldTemperature
            : values.coldTemperature + (equilibriumTemperature - values.coldTemperature) * progress;
        drawThermometer(width * 0.12, thermometerTop, thermometerHeight, hotTemperature, 'Ыстық су');
        drawThermometer(width * 0.88, thermometerTop, thermometerHeight, coldTemperature, 'Салқын су');

        const cupWidth = width * 0.32;
        const cupLeft = (width - cupWidth) / 2;
        const cupTop = height * 0.32;
        const cupBottom = height * 0.86;
        const waterFraction = 0.28 + progress * 0.12;
        const waterTop = cupBottom - (cupBottom - cupTop) * waterFraction;
        context.fillStyle = 'rgba(58,157,231,0.68)';
        context.fillRect(cupLeft + 10, waterTop, cupWidth - 20, cupBottom - waterTop);
        context.beginPath();
        context.ellipse(width / 2, waterTop, cupWidth / 2 - 10, 12, 0, 0, Math.PI * 2);
        context.fillStyle = 'rgba(107,195,255,0.84)';
        context.fill();
        context.strokeStyle = '#83b9ef';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(cupLeft, cupTop);
        context.lineTo(cupLeft, cupBottom - 16);
        context.quadraticCurveTo(cupLeft, cupBottom, cupLeft + 18, cupBottom);
        context.lineTo(cupLeft + cupWidth - 18, cupBottom);
        context.quadraticCurveTo(cupLeft + cupWidth, cupBottom, cupLeft + cupWidth, cupBottom - 16);
        context.lineTo(cupLeft + cupWidth, cupTop);
        context.stroke();
        context.beginPath();
        context.ellipse(width / 2, cupTop, cupWidth / 2, 14, 0, 0, Math.PI * 2);
        context.stroke();

        context.fillStyle = '#d4e4ff';
        context.font = `600 ${Math.max(14, width * 0.018)}px Segoe UI, Arial, sans-serif`;
        context.fillText('Калориметрдегі су қоспасы', width / 2, cupBottom + 28);
        context.fillStyle = '#17345a';
        context.fillRect(0, height * 0.94, width, height * 0.06);

        context.fillStyle = '#ffafc0';
        context.font = `600 ${Math.max(15, width * 0.02)}px Segoe UI, Arial, sans-serif`;
        context.fillText(progress === 1 ? 'Жылулық тепе-теңдік орнады'
            : progress > 0 ? 'Жылу ыстық судан салқын суға өтеді'
                : 'Суды калориметрде араластыруға дайын', width / 2, height * 0.15);
    };

    const resizeCanvas = () => {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        drawScene();
    };

    const animate = (time) => {
        if (running && !paused) {
            progress = Math.min(1, (time - startedAt) / duration);
            measuredTemperature = getValues().calorimeterTemperature
                + (equilibriumTemperature - getValues().calorimeterTemperature) * progress;
            if (progress === 1) {
                running = false;
                pauseButton.disabled = true;
                startButton.disabled = false;
                Object.values(fields).forEach((field) => { field.disabled = false; });
                status.textContent = 'Тәжірибе аяқталды. Тепе-теңдік температурасын өлшеп, есеппен салыстыр.';
                result.textContent = `Өлшенген температура: ${measuredTemperature.toFixed(1)} °C · Есептік мән: ${equilibriumTemperature.toFixed(1)} °C`;
            }
        }
        drawScene();
        if (overlay.classList.contains('is-open')) frameId = window.requestAnimationFrame(animate);
    };

    const openLab = async () => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(animate);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };

    const closeLab = async () => {
        if (running && !paused) {
            pausedAt = performance.now();
            paused = true;
            updateControls();
        }
        window.cancelAnimationFrame(frameId);
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };

    startButton.addEventListener('click', () => {
        if (!validate()) return;
        equilibriumTemperature = calculateEquilibrium();
        progress = 0;
        measuredTemperature = getValues().calorimeterTemperature;
        paused = false;
        running = true;
        startedAt = performance.now();
        status.textContent = 'Жылу ыстық судан салқын суға беріліп жатыр. Термометрлерді бақыла.';
        result.textContent = `Есептік тепе-теңдік температурасы: ${equilibriumTemperature.toFixed(1)} °C`;
        updateControls();
        drawScene();
    });

    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            startedAt += performance.now() - pausedAt;
            paused = false;
        } else {
            pausedAt = performance.now();
            paused = true;
        }
        updateControls();
    });

    resetButton.addEventListener('click', () => {
        running = false;
        paused = false;
        progress = 0;
        equilibriumTemperature = null;
        measuredTemperature = Number(fields.calorimeterTemperature.value);
        status.textContent = 'Пуск батырмасын басып, жылу алмасуды бақыла.';
        result.textContent = 'Есептік тепе-теңдік температурасы: —';
        updateControls();
        drawScene();
    });

    Object.values(fields).forEach((field) => field.addEventListener('input', drawScene));
    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    window.addEventListener('resize', resizeCanvas);
    updateControls();
    resizeCanvas();
}

function initializeBrownianLab(elements) {
    const { overlay, canvas, openButton, closeButton, context, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('brownianLabControls');
    const standardControls = document.getElementById('standardLabControls');
    const iceControls = document.getElementById('iceMeltingControls');
    const diffusionControls = document.getElementById('diffusionLabControls');
    const legend = document.getElementById('labLegend');
    const trailCanvas = document.getElementById('brownianTrailCanvas');
    const trailContext = trailCanvas.getContext('2d');
    const startButton = document.getElementById('brownianStart');
    const pauseButton = document.getElementById('brownianPause');
    const resetButton = document.getElementById('brownianReset');
    const inputMap = {
        moleculeCount: document.getElementById('brownianMoleculeCount'),
        temperature: document.getElementById('brownianTemperature'),
        viscosity: document.getElementById('brownianViscosity'),
        moleculeSize: document.getElementById('brownianMoleculeSize'),
        particleSize: document.getElementById('brownianParticleSize'),
        particleMass: document.getElementById('brownianParticleMass'),
        trailLength: document.getElementById('brownianTrailLength')
    };
    const statNodes = {
        time: document.getElementById('brownianTime'),
        speed: document.getElementById('brownianSpeed'),
        collisions: document.getElementById('brownianCollisions'),
        displacement: document.getElementById('brownianDisplacement')
    };
    const valueFormatters = {
        viscosity: (value) => Number(value).toFixed(3),
        temperature: (value) => Number(value).toFixed(1),
        particleMass: (value) => Number(value).toFixed(1)
    };
    const inputs = Object.values(inputMap);
    let width = 0;
    let height = 0;
    let trailWidth = 0;
    let trailHeight = 0;
    let molecules = [];
    let trail = [];
    let tracer = { x: 0, y: 0 };
    let origin = { x: 0, y: 0 };
    let running = false;
    let paused = false;
    let elapsed = 0;
    let startedAt = 0;
    let lastFrameTime = 0;
    let previousTracer = { x: 0, y: 0 };
    let collisions = 0;
    let frameId = 0;

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = `Виртуалды зертхана • ${new URLSearchParams(window.location.search).get('grade') || '8'}-сынып`;
    canvas.setAttribute('aria-label', 'Молекулалармен соқтығысқан броундық бөлшек');
    standardControls.classList.add('hidden');
    iceControls.classList.add('hidden');
    diffusionControls.classList.add('hidden');
    controls.classList.remove('hidden');
    legend.classList.add('hidden');
    trailCanvas.classList.remove('hidden');
    labWindow.classList.add('is-brownian-lab');

    const getBounds = () => {
        const margin = Math.max(26, Math.min(42, width * 0.05));
        return {
            left: margin,
            right: width - margin,
            top: Math.max(54, height * 0.12),
            bottom: height - Math.max(24, height * 0.08)
        };
    };

    const formatInput = (name, value) => {
        const output = document.getElementById(`brownian${name[0].toUpperCase()}${name.slice(1)}Value`);
        output.value = value;
        output.textContent = valueFormatters[name] ? valueFormatters[name](value) : value;
    };

    const updateStatistics = () => {
        statNodes.time.value = `${(elapsed / 1000).toFixed(1)} с`;
        statNodes.time.textContent = statNodes.time.value;
        const seconds = elapsed / 1000;
        const pathLength = trail.reduce((distance, point, index) => {
            if (!index) return distance;
            return distance + Math.hypot(point.x - trail[index - 1].x, point.y - trail[index - 1].y);
        }, 0);
        const speed = seconds > 0 ? pathLength / seconds : 0;
        const displacement = Math.hypot(tracer.x - origin.x, tracer.y - origin.y);
        statNodes.speed.value = speed.toFixed(2);
        statNodes.speed.textContent = speed.toFixed(2);
        statNodes.collisions.value = collisions;
        statNodes.collisions.textContent = collisions;
        statNodes.displacement.value = displacement.toFixed(2);
        statNodes.displacement.textContent = displacement.toFixed(2);
    };

    const createMolecules = () => {
        const bounds = getBounds();
        const radius = Number(inputMap.moleculeSize.value) * 0.58;
        molecules = Array.from({ length: Number(inputMap.moleculeCount.value) }, () => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 16 + Math.sqrt(Number(inputMap.temperature.value)) * 18;
            return {
                x: bounds.left + radius + Math.random() * Math.max(1, bounds.right - bounds.left - radius * 2),
                y: bounds.top + radius + Math.random() * Math.max(1, bounds.bottom - bounds.top - radius * 2),
                vx: Math.cos(angle) * speed * (0.35 + Math.random()),
                vy: Math.sin(angle) * speed * (0.35 + Math.random()),
                radius
            };
        });
    };

    const resetExperiment = () => {
        const bounds = getBounds();
        tracer = { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 };
        origin = { ...tracer };
        previousTracer = { ...tracer };
        trail = [{ ...tracer }];
        collisions = 0;
        elapsed = 0;
        startedAt = 0;
        createMolecules();
        clearTrail();
        updateStatistics();
    };

    const clearTrail = () => {
        if (!trailContext) return;
        trailContext.clearRect(0, 0, trailWidth, trailHeight);
        const gradient = trailContext.createLinearGradient(0, 0, trailWidth, trailHeight);
        gradient.addColorStop(0, '#102748');
        gradient.addColorStop(1, '#21132f');
        trailContext.fillStyle = gradient;
        trailContext.fillRect(0, 0, trailWidth, trailHeight);
        trailContext.strokeStyle = 'rgba(152, 187, 235, 0.12)';
        trailContext.lineWidth = 1;
        for (let row = 1; row < 5; row += 1) {
            const y = trailHeight * row / 5;
            trailContext.beginPath();
            trailContext.moveTo(0, y);
            trailContext.lineTo(trailWidth, y);
            trailContext.stroke();
        }
        trailContext.fillStyle = '#b7d7ff';
        trailContext.font = '600 13px Segoe UI, Arial, sans-serif';
        trailContext.textAlign = 'left';
        trailContext.fillText('Броундық бөлшектің траекториясы', 12, 20);
    };

    const updateTrail = () => {
        const point = {
            x: (tracer.x - getBounds().left) / (getBounds().right - getBounds().left) * trailWidth,
            y: 30 + (tracer.y - getBounds().top) / (getBounds().bottom - getBounds().top) * Math.max(1, trailHeight - 40)
        };
        trailContext.beginPath();
        trailContext.moveTo(previousTracer.trailX ?? point.x, previousTracer.trailY ?? point.y);
        trailContext.lineTo(point.x, point.y);
        trailContext.strokeStyle = '#ff7891';
        trailContext.lineWidth = 2;
        trailContext.stroke();
        previousTracer.trailX = point.x;
        previousTracer.trailY = point.y;
        trail.push({ x: tracer.x, y: tracer.y });
        const maxPoints = Math.max(20, Math.round(Number(inputMap.trailLength.value) / 16));
        if (trail.length > maxPoints) trail.splice(1, trail.length - maxPoints);
    };

    const drawScene = (delta) => {
        if (!width || !height) return;
        const bounds = getBounds();
        context.clearRect(0, 0, width, height);
        const background = context.createLinearGradient(0, 0, 0, height);
        background.addColorStop(0, '#102748');
        background.addColorStop(0.62, '#0b1a33');
        background.addColorStop(1, '#25132f');
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
        context.fillStyle = 'rgba(255,255,255,0.025)';
        context.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
        context.strokeStyle = 'rgba(130,180,245,0.55)';
        context.lineWidth = 2;
        context.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

        if (running && !paused && delta > 0) {
            const temperature = Number(inputMap.temperature.value);
            const viscosity = Number(inputMap.viscosity.value);
            const mass = Number(inputMap.particleMass.value);
            const collisionRate = Math.min(180, Number(inputMap.moleculeCount.value) / 250
                * Math.sqrt(temperature / 5) * (0.01 / viscosity) * (4 / Number(inputMap.moleculeSize.value)) * 22);
            molecules.forEach((molecule) => {
                molecule.x += molecule.vx * delta;
                molecule.y += molecule.vy * delta;
                if (molecule.x < bounds.left + molecule.radius || molecule.x > bounds.right - molecule.radius) {
                    molecule.vx *= -1;
                    molecule.x = Math.max(bounds.left + molecule.radius, Math.min(bounds.right - molecule.radius, molecule.x));
                }
                if (molecule.y < bounds.top + molecule.radius || molecule.y > bounds.bottom - molecule.radius) {
                    molecule.vy *= -1;
                    molecule.y = Math.max(bounds.top + molecule.radius, Math.min(bounds.bottom - molecule.radius, molecule.y));
                }
            });

            const collisionExpectation = collisionRate * delta;
            const collisionEvents = Math.floor(collisionExpectation) + (Math.random() < collisionExpectation % 1 ? 1 : 0);
            const kick = 2.4 * Math.sqrt(temperature / 5) * Math.sqrt(5 / mass);
            for (let index = 0; index < collisionEvents; index += 1) {
                const angle = Math.random() * Math.PI * 2;
                tracer.x += Math.cos(angle) * kick;
                tracer.y += Math.sin(angle) * kick;
            }
            const tracerRadius = Number(inputMap.particleSize.value) * 0.65;
            if (tracer.x < bounds.left + tracerRadius || tracer.x > bounds.right - tracerRadius) {
                tracer.x = Math.max(bounds.left + tracerRadius, Math.min(bounds.right - tracerRadius, tracer.x));
            }
            if (tracer.y < bounds.top + tracerRadius || tracer.y > bounds.bottom - tracerRadius) {
                tracer.y = Math.max(bounds.top + tracerRadius, Math.min(bounds.bottom - tracerRadius, tracer.y));
            }
            collisions += collisionEvents;
            elapsed = performance.now() - startedAt;
            updateTrail();
            updateStatistics();
        }

        molecules.forEach((molecule) => {
            context.beginPath();
            context.arc(molecule.x, molecule.y, molecule.radius, 0, Math.PI * 2);
            context.fillStyle = '#49bfff';
            context.fill();
        });

        const tracerRadius = Number(inputMap.particleSize.value) * 0.65;
        const glow = context.createRadialGradient(tracer.x - tracerRadius * 0.3, tracer.y - tracerRadius * 0.3, 1, tracer.x, tracer.y, tracerRadius * 1.8);
        glow.addColorStop(0, '#fff3f4');
        glow.addColorStop(0.42, '#ffb1be');
        glow.addColorStop(1, 'rgba(255,85,120,0.18)');
        context.beginPath();
        context.arc(tracer.x, tracer.y, tracerRadius * 1.8, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();
        context.beginPath();
        context.arc(tracer.x, tracer.y, tracerRadius, 0, Math.PI * 2);
        context.fillStyle = '#ffe8ed';
        context.fill();
        context.strokeStyle = '#ff718d';
        context.lineWidth = 2;
        context.stroke();
    };

    const resizeCanvas = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const bounds = canvas.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const trailBounds = trailCanvas.getBoundingClientRect();
        trailWidth = trailBounds.width;
        trailHeight = trailBounds.height;
        trailCanvas.width = Math.round(trailWidth * pixelRatio);
        trailCanvas.height = Math.round(trailHeight * pixelRatio);
        trailContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        resetExperiment();
        drawScene(0);
    };

    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        inputs.forEach((input) => { input.disabled = running; });
    };

    const animate = (time) => {
        const delta = lastFrameTime ? Math.min((time - lastFrameTime) / 1000, 0.04) : 0;
        lastFrameTime = time;
        drawScene(delta);
        if (overlay.classList.contains('is-open')) frameId = window.requestAnimationFrame(animate);
    };

    const openLab = async () => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        lastFrameTime = 0;
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(animate);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };

    const closeLab = async () => {
        if (running && !paused) {
            elapsed = performance.now() - startedAt;
            paused = true;
            updateControls();
        }
        window.cancelAnimationFrame(frameId);
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };

    startButton.addEventListener('click', () => {
        running = true;
        paused = false;
        startedAt = performance.now() - elapsed;
        updateControls();
    });

    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            startedAt = performance.now() - elapsed;
            paused = false;
        } else {
            elapsed = performance.now() - startedAt;
            paused = true;
        }
        updateControls();
        updateStatistics();
    });

    resetButton.addEventListener('click', () => {
        running = false;
        paused = false;
        inputs.forEach((input) => { input.disabled = false; });
        updateControls();
        resetExperiment();
        clearTrail();
        drawScene(0);
    });

    inputs.forEach((input) => {
        input.addEventListener('input', () => {
            const name = input.id.replace('brownian', '');
            const key = name[0].toLowerCase() + name.slice(1);
            formatInput(key, input.value);
            if (key === 'moleculeCount' || key === 'moleculeSize' || key === 'particleSize') {
                if (key === 'particleSize') drawScene(0);
                else {
                    createMolecules();
                    drawScene(0);
                }
            }
            if (key === 'trailLength' && trail.length > Number(input.value) / 16) {
                trail.splice(1, trail.length - Math.max(20, Math.round(Number(input.value) / 16)));
                clearTrail();
                for (let index = 1; index < trail.length; index += 1) {
                    const bounds = getBounds();
                    const point = {
                        x: (trail[index].x - bounds.left) / (bounds.right - bounds.left) * trailWidth,
                        y: 30 + (trail[index].y - bounds.top) / (bounds.bottom - bounds.top) * Math.max(1, trailHeight - 40)
                    };
                    const previous = trail[index - 1];
                    const previousPoint = {
                        x: (previous.x - bounds.left) / (bounds.right - bounds.left) * trailWidth,
                        y: 30 + (previous.y - bounds.top) / (bounds.bottom - bounds.top) * Math.max(1, trailHeight - 40)
                    };
                    trailContext.beginPath();
                    trailContext.moveTo(previousPoint.x, previousPoint.y);
                    trailContext.lineTo(point.x, point.y);
                    trailContext.strokeStyle = '#ff7891';
                    trailContext.lineWidth = 2;
                    trailContext.stroke();
                }
            }
        });
    });

    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    window.addEventListener('resize', resizeCanvas);
    Object.entries(inputMap).forEach(([name, input]) => formatInput(name, input.value));
    updateControls();
    resizeCanvas();
}

function initializeDiffusionLab(elements) {
    const { overlay, canvas, openButton, closeButton, context, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('diffusionLabControls');
    const standardControls = document.getElementById('standardLabControls');
    const iceControls = document.getElementById('iceMeltingControls');
    const legend = document.getElementById('labLegend');
    const startButton = document.getElementById('diffusionStart');
    const pauseButton = document.getElementById('diffusionPause');
    const resetButton = document.getElementById('diffusionReset');
    const timer = document.getElementById('diffusionTimer');
    const radiusInput = document.getElementById('diffusionTubeRadius');
    const temperatureInput = document.getElementById('diffusionTemperature');
    const blueCountInput = document.getElementById('diffusionBlueCount');
    const redCountInput = document.getElementById('diffusionRedCount');
    const inputs = [radiusInput, temperatureInput, blueCountInput, redCountInput];
    let width = 0;
    let height = 0;
    let particles = [];
    let running = false;
    let paused = false;
    let startedAt = 0;
    let elapsed = 0;
    let lastFrameTime = 0;
    let frameId = 0;

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = `Виртуалды зертхана • ${new URLSearchParams(window.location.search).get('grade') || '7'}-сынып`;
    canvas.setAttribute('aria-label', 'Екі ыдыстағы көк және қызыл бөлшектердің диффузия қозғалысы');
    standardControls.classList.add('hidden');
    iceControls.classList.add('hidden');
    controls.classList.remove('hidden');
    legend.classList.add('hidden');
    labWindow.classList.add('is-diffusion-lab');

    const getBounds = () => {
        const margin = Math.max(24, Math.min(42, width * 0.045));
        return {
            left: margin,
            right: width - margin,
            top: Math.max(86, height * 0.17),
            bottom: height - Math.max(38, height * 0.09)
        };
    };

    const apertureHeight = () => {
        const bounds = getBounds();
        return Math.min((bounds.bottom - bounds.top) * 0.3, (Number(radiusInput.value) / 30) * height * 0.3);
    };

    const particleSpeed = () => 20 + Math.sqrt(Number(temperatureInput.value) + 1) * 5;

    const createParticles = () => {
        const bounds = getBounds();
        const midpoint = (bounds.left + bounds.right) / 2;
        const radius = Math.max(2.2, Math.min(4.4, width / 175));
        particles = [];
        [
            { color: '#49aaff', count: Number(blueCountInput.value), left: true },
            { color: '#ff526e', count: Number(redCountInput.value), left: false }
        ].forEach((group) => {
            for (let index = 0; index < group.count; index += 1) {
                const angle = Math.random() * Math.PI * 2;
                const speed = particleSpeed() * (0.45 + Math.random() * 0.9);
                const minX = group.left ? bounds.left + radius * 2 : midpoint + radius * 2;
                const maxX = group.left ? midpoint - radius * 2 : bounds.right - radius * 2;
                particles.push({
                    x: minX + Math.random() * Math.max(1, maxX - minX),
                    y: bounds.top + radius * 2 + Math.random() * Math.max(1, bounds.bottom - bounds.top - radius * 4),
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius,
                    color: group.color,
                    type: group.left ? 'blue' : 'red'
                });
            }
        });
        updateStatistics();
    };

    const updateStatistics = () => {
        const midpoint = width / 2;
        const blueLeft = particles.filter((particle) => particle.type === 'blue' && particle.x < midpoint).length;
        const redLeft = particles.filter((particle) => particle.type === 'red' && particle.x < midpoint).length;
        document.getElementById('diffusionBlueLeft').value = blueLeft;
        document.getElementById('diffusionBlueLeft').textContent = blueLeft;
        document.getElementById('diffusionBlueRight').value = particles.filter((particle) => particle.type === 'blue').length - blueLeft;
        document.getElementById('diffusionBlueRight').textContent = document.getElementById('diffusionBlueRight').value;
        document.getElementById('diffusionRedLeft').value = redLeft;
        document.getElementById('diffusionRedLeft').textContent = redLeft;
        document.getElementById('diffusionRedRight').value = particles.filter((particle) => particle.type === 'red').length - redLeft;
        document.getElementById('diffusionRedRight').textContent = document.getElementById('diffusionRedRight').value;
    };

    const updateTimer = () => {
        const centiseconds = Math.floor(elapsed / 10) % 100;
        const totalSeconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    };

    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        inputs.forEach((input) => { input.disabled = running; });
    };

    const drawScene = (delta) => {
        if (!width || !height) return;
        const bounds = getBounds();
        const midpoint = (bounds.left + bounds.right) / 2;
        const opening = apertureHeight();
        const vesselWidth = midpoint - bounds.left;

        context.clearRect(0, 0, width, height);
        const background = context.createLinearGradient(0, 0, 0, height);
        background.addColorStop(0, '#102748');
        background.addColorStop(0.58, '#0b1a33');
        background.addColorStop(1, '#2b1235');
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);

        context.textAlign = 'center';
        context.fillStyle = '#b7d7ff';
        context.font = `700 ${Math.max(20, Math.min(34, width * 0.036))}px Segoe UI, Arial, sans-serif`;
        context.fillText('ДИФФУЗИЯ ҚҰБЫЛЫСЫН ЗЕРТТЕУ', width / 2, height * 0.075);
        context.fillStyle = '#71c9ff';
        context.font = `600 ${Math.max(14, width * 0.018)}px Segoe UI, Arial, sans-serif`;
        context.fillText('Сол жақ ыдыс', bounds.left + vesselWidth / 2, bounds.top - 12);
        context.fillStyle = '#ff9bb0';
        context.fillText('Оң жақ ыдыс', midpoint + vesselWidth / 2, bounds.top - 12);

        context.fillStyle = 'rgba(255,255,255,0.035)';
        context.fillRect(bounds.left, bounds.top, vesselWidth, bounds.bottom - bounds.top);
        context.fillRect(midpoint, bounds.top, vesselWidth, bounds.bottom - bounds.top);
        context.strokeStyle = 'rgba(130,180,245,0.64)';
        context.lineWidth = 2;
        context.strokeRect(bounds.left, bounds.top, vesselWidth, bounds.bottom - bounds.top);
        context.strokeRect(midpoint, bounds.top, vesselWidth, bounds.bottom - bounds.top);

        const openingTop = height / 2 - opening / 2;
        const openingBottom = height / 2 + opening / 2;
        context.strokeStyle = 'rgba(190,216,255,0.75)';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(midpoint, bounds.top);
        context.lineTo(midpoint, running ? openingTop : bounds.bottom);
        context.moveTo(midpoint, running ? openingBottom : bounds.bottom);
        context.lineTo(midpoint, bounds.bottom);
        context.stroke();
        if (running) {
            context.fillStyle = 'rgba(78,215,220,0.15)';
            context.fillRect(midpoint - Math.min(35, width * 0.04), openingTop, Math.min(70, width * 0.08), opening);
            context.strokeStyle = '#73e1e4';
            context.lineWidth = 2;
            context.strokeRect(midpoint - Math.min(35, width * 0.04), openingTop, Math.min(70, width * 0.08), opening);
        }

        const speedScale = particleSpeed() / 20;
        if (running && !paused && delta > 0) {
            particles.forEach((particle) => {
                const previousX = particle.x;
                particle.x += particle.vx * delta * speedScale;
                particle.y += particle.vy * delta * speedScale;
                if (particle.x < bounds.left + particle.radius || particle.x > bounds.right - particle.radius) {
                    particle.vx *= -1;
                    particle.x = Math.max(bounds.left + particle.radius, Math.min(bounds.right - particle.radius, particle.x));
                }
                if (particle.y < bounds.top + particle.radius || particle.y > bounds.bottom - particle.radius) {
                    particle.vy *= -1;
                    particle.y = Math.max(bounds.top + particle.radius, Math.min(bounds.bottom - particle.radius, particle.y));
                }
                const crossedCenter = (previousX < midpoint && particle.x >= midpoint) || (previousX >= midpoint && particle.x < midpoint);
                if (crossedCenter && (particle.y < openingTop + particle.radius || particle.y > openingBottom - particle.radius)) {
                    particle.vx *= -1;
                    particle.x = previousX < midpoint ? midpoint - particle.radius : midpoint + particle.radius;
                }
            });
            elapsed = performance.now() - startedAt;
            updateTimer();
            updateStatistics();
        }

        particles.forEach((particle) => {
            const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 3);
            glow.addColorStop(0, '#ffffff');
            glow.addColorStop(0.28, particle.color);
            glow.addColorStop(1, `${particle.color}00`);
            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
            context.fillStyle = glow;
            context.fill();
            context.beginPath();
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fillStyle = particle.color;
            context.fill();
        });
    };

    const resizeCanvas = () => {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        createParticles();
        drawScene(0);
    };

    const animate = (time) => {
        const delta = lastFrameTime ? Math.min((time - lastFrameTime) / 1000, 0.04) : 0;
        lastFrameTime = time;
        drawScene(delta);
        if (overlay.classList.contains('is-open')) frameId = window.requestAnimationFrame(animate);
    };

    const openLab = async () => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        lastFrameTime = 0;
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(animate);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };

    const closeLab = async () => {
        if (running && !paused) {
            elapsed = performance.now() - startedAt;
            paused = true;
            updateControls();
        }
        window.cancelAnimationFrame(frameId);
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };

    startButton.addEventListener('click', () => {
        if (!particles.length) createParticles();
        running = true;
        paused = false;
        startedAt = performance.now() - elapsed;
        updateControls();
        drawScene(0);
    });

    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            startedAt = performance.now() - elapsed;
            paused = false;
        } else {
            elapsed = performance.now() - startedAt;
            paused = true;
        }
        updateControls();
        updateTimer();
    });

    resetButton.addEventListener('click', () => {
        running = false;
        paused = false;
        elapsed = 0;
        startedAt = 0;
        timer.textContent = '00:00.00';
        inputs.forEach((input) => { input.disabled = false; });
        updateControls();
        createParticles();
        drawScene(0);
    });

    radiusInput.addEventListener('input', () => {
        document.getElementById('diffusionTubeRadiusValue').value = radiusInput.value;
        document.getElementById('diffusionTubeRadiusValue').textContent = radiusInput.value;
        drawScene(0);
    });
    temperatureInput.addEventListener('input', () => {
        document.getElementById('diffusionTemperatureValue').value = temperatureInput.value;
        document.getElementById('diffusionTemperatureValue').textContent = temperatureInput.value;
    });
    blueCountInput.addEventListener('input', () => {
        document.getElementById('diffusionBlueCountValue').value = blueCountInput.value;
        document.getElementById('diffusionBlueCountValue').textContent = blueCountInput.value;
        if (!running) {
            createParticles();
            drawScene(0);
        }
    });
    redCountInput.addEventListener('input', () => {
        document.getElementById('diffusionRedCountValue').value = redCountInput.value;
        document.getElementById('diffusionRedCountValue').textContent = redCountInput.value;
        if (!running) {
            createParticles();
            drawScene(0);
        }
    });

    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    window.addEventListener('resize', resizeCanvas);
    updateControls();
    resizeCanvas();
}

function initializeIceMeltingLab(elements) {
    const { overlay, canvas, openButton, closeButton, context, config } = elements;
    const labWindow = overlay.querySelector('.lab-window');
    const controls = document.getElementById('iceMeltingControls');
    const standardControls = document.getElementById('standardLabControls');
    const legend = document.getElementById('labLegend');
    const startButton = document.getElementById('iceLabStart');
    const pauseButton = document.getElementById('iceLabPause');
    const stopButton = document.getElementById('iceLabStop');
    const status = document.getElementById('iceLabStatus');
    const result = document.getElementById('iceLabResult');
    const fields = {
        waterVolume: document.getElementById('iceWaterVolume'),
        waterTemperature: document.getElementById('iceWaterTemperature'),
        iceMass: document.getElementById('iceMass'),
        iceTemperature: document.getElementById('iceTemperature'),
        calorimeterMass: document.getElementById('calorimeterMass'),
        calorimeterHeatCapacity: document.getElementById('calorimeterHeatCapacity')
    };
    const waterHeatCapacity = 4200;
    const iceHeatCapacity = 2100;
    const latentHeat = 334000;
    const duration = 16000;
    let width = 0;
    let height = 0;
    let progress = 0;
    let running = false;
    let paused = false;
    let startedAt = 0;
    let pausedAt = 0;
    let frameId = 0;
    let finalTemperature = null;

    document.getElementById('labTitle').textContent = config.title;
    document.getElementById('labIntro').textContent = config.intro;
    document.getElementById('labGradeLabel').textContent = `Виртуалды зертхана • ${new URLSearchParams(window.location.search).get('grade') || '7'}-сынып`;
    if (config.instructions) {
        controls.querySelector('.lab-instructions').textContent = config.instructions;
    }
    canvas.setAttribute('aria-label', 'Мұздың калориметрде еруі мен температура өзгерісінің анимациясы');
    standardControls.classList.add('hidden');
    controls.classList.remove('hidden');
    legend.classList.add('hidden');
    labWindow.classList.add('is-ice-lab');

    const getParameters = () => Object.fromEntries(
        Object.entries(fields).map(([name, field]) => [name, Number(field.value)])
    );

    const validateParameters = () => {
        Object.values(fields).forEach((field) => field.setCustomValidity(''));
        const valid = Object.values(fields).every((field) => {
            field.required = true;
            return field.reportValidity();
        });
        if (!valid) return false;
        const values = getParameters();
        if (!Object.values(values).every(Number.isFinite)) return false;
        const availableEnergy = (values.waterVolume * waterHeatCapacity
            + values.calorimeterMass * values.calorimeterHeatCapacity) * values.waterTemperature;
        const iceWarmingEnergy = values.iceMass * iceHeatCapacity * -values.iceTemperature;
        if (availableEnergy < iceWarmingEnergy) {
            fields.waterTemperature.setCustomValidity('Судың жылуы мұзды 0 °C-қа дейін жеткізуге жеткіліксіз.');
            fields.waterTemperature.reportValidity();
            return false;
        }
        return true;
    };

    const updateControls = () => {
        startButton.disabled = running;
        pauseButton.disabled = !running;
        pauseButton.textContent = paused ? 'Жалғастыру' : 'Пауза';
        Object.values(fields).forEach((field) => {
            field.disabled = running;
        });
    };

    const calculateResult = () => {
        const values = getParameters();
        const waterMass = values.waterVolume;
        const warmCapacity = waterMass * waterHeatCapacity
            + values.calorimeterMass * values.calorimeterHeatCapacity;
        const initialEnergy = warmCapacity * values.waterTemperature;
        const iceWarmingEnergy = values.iceMass * iceHeatCapacity * -values.iceTemperature;
        const meltEnergy = values.iceMass * latentHeat;
        const energyAfterWarmingIce = initialEnergy - iceWarmingEnergy;

        if (energyAfterWarmingIce <= 0) {
            const temperature = (initialEnergy + values.iceMass * iceHeatCapacity * values.iceTemperature)
                / (warmCapacity + values.iceMass * iceHeatCapacity);
            return { completeMelt: false, temperature };
        }
        if (energyAfterWarmingIce < meltEnergy) {
            return { completeMelt: false, temperature: 0 };
        }

        const finalTemp = (initialEnergy - iceWarmingEnergy - meltEnergy)
            / (warmCapacity + values.iceMass * waterHeatCapacity);
        const observedLatentHeat = (
            warmCapacity * (values.waterTemperature - finalTemp)
            - iceWarmingEnergy
            - values.iceMass * waterHeatCapacity * finalTemp
        ) / values.iceMass;
        return { completeMelt: true, temperature: finalTemp, latentHeat: observedLatentHeat };
    };

    const drawThermometer = (x, y, thermometerHeight, temperature, label) => {
        const tubeWidth = Math.max(13, width * 0.018);
        const tubeTop = y + 20;
        const tubeBottom = y + thermometerHeight - 22;
        const bulbRadius = tubeWidth * 0.8;
        const fraction = Math.max(0, Math.min(1, (temperature + 20) / 120));
        context.fillStyle = 'rgba(255,255,255,0.82)';
        context.strokeStyle = '#75a9e8';
        context.lineWidth = 3;
        context.beginPath();
        context.roundRect(x - tubeWidth * 1.5, y, tubeWidth * 3, thermometerHeight, 12);
        context.fill();
        context.stroke();
        context.fillStyle = '#18345b';
        context.fillRect(x - 3, tubeTop, 6, tubeBottom - tubeTop);
        context.fillStyle = '#bd2544';
        context.fillRect(x - 3, tubeBottom - (tubeBottom - tubeTop) * fraction, 6, (tubeBottom - tubeTop) * fraction);
        context.beginPath();
        context.arc(x, tubeBottom + 2, bulbRadius, 0, Math.PI * 2);
        context.fillStyle = '#bd2544';
        context.fill();
        context.strokeStyle = '#d74d70';
        context.stroke();
        context.fillStyle = '#e4efff';
        context.textAlign = 'center';
        context.font = `600 ${Math.max(14, width * 0.018)}px Segoe UI, Arial, sans-serif`;
        context.fillText(`${temperature.toFixed(1)} °C`, x, y + thermometerHeight + 25);
        context.fillStyle = '#9dcaff';
        context.font = `600 ${Math.max(15, width * 0.022)}px Segoe UI, Arial, sans-serif`;
        context.fillText(label, x, y - 10);
    };

    const drawScene = () => {
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        const background = context.createLinearGradient(0, 0, 0, height);
        background.addColorStop(0, '#102748');
        background.addColorStop(0.58, '#0b1a33');
        background.addColorStop(1, '#2b1235');
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);

        context.fillStyle = '#b7d7ff';
        context.textAlign = 'center';
        context.font = `700 ${Math.max(20, Math.min(34, width * 0.036))}px Segoe UI, Arial, sans-serif`;
        context.fillText('МҰЗДЫҢ МЕНШІКТІ БАЛҚУ ЖЫЛУЫН АНЫҚТАУ', width / 2, height * 0.08);

        const thermometerHeight = height * 0.56;
        const thermometerTop = height * 0.19;
        const waterTemperature = finalTemperature === null
            ? Number(fields.waterTemperature.value)
            : Number(fields.waterTemperature.value)
                + (finalTemperature - Number(fields.waterTemperature.value)) * progress;
        drawThermometer(width * 0.14, thermometerTop, thermometerHeight, waterTemperature, 'Су');
        drawThermometer(width * 0.86, thermometerTop, thermometerHeight, finalTemperature === null
            ? Number(fields.iceTemperature.value)
            : Number(fields.iceTemperature.value)
                + (finalTemperature - Number(fields.iceTemperature.value)) * progress, 'Мұз');

        const cupWidth = width * 0.34;
        const cupLeft = (width - cupWidth) / 2;
        const cupTop = height * 0.37;
        const cupBottom = height * 0.88;
        const innerLeft = cupLeft + 10;
        const innerRight = cupLeft + cupWidth - 10;
        const waterLevel = cupBottom - (cupBottom - cupTop) * (0.36 + progress * 0.035);

        context.fillStyle = 'rgba(71, 182, 214, 0.7)';
        context.fillRect(innerLeft, waterLevel, innerRight - innerLeft, cupBottom - waterLevel);
        context.beginPath();
        context.ellipse((innerLeft + innerRight) / 2, waterLevel, (innerRight - innerLeft) / 2, 12, 0, 0, Math.PI * 2);
        context.fillStyle = 'rgba(111, 209, 229, 0.9)';
        context.fill();
        context.strokeStyle = '#83b9ef';
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(cupLeft, cupTop);
        context.lineTo(cupLeft, cupBottom - 18);
        context.quadraticCurveTo(cupLeft, cupBottom, cupLeft + 20, cupBottom);
        context.lineTo(cupLeft + cupWidth - 20, cupBottom);
        context.quadraticCurveTo(cupLeft + cupWidth, cupBottom, cupLeft + cupWidth, cupBottom - 18);
        context.lineTo(cupLeft + cupWidth, cupTop);
        context.stroke();
        context.beginPath();
        context.ellipse(width / 2, cupTop, cupWidth / 2, 15, 0, 0, Math.PI * 2);
        context.stroke();

        const iceRemaining = finalTemperature === null ? 1 : Math.max(0, 1 - Math.max(0, (progress - 0.18) / 0.78));
        if (iceRemaining > 0.03) {
            const cubeSize = height * 0.12 * iceRemaining;
            const cubeX = width / 2 - cubeSize / 2;
            const cubeY = waterLevel - cubeSize * 0.55;
            context.fillStyle = 'rgba(179, 231, 244, 0.95)';
            context.strokeStyle = '#5fa9ec';
            context.lineWidth = 3;
            context.fillRect(cubeX, cubeY, cubeSize, cubeSize);
            context.strokeRect(cubeX, cubeY, cubeSize, cubeSize);
            context.beginPath();
            context.moveTo(cubeX, cubeY + cubeSize * 0.25);
            context.lineTo(cubeX + cubeSize * 0.3, cubeY);
            context.lineTo(cubeX + cubeSize, cubeY + cubeSize * 0.62);
            context.strokeStyle = 'rgba(255,255,255,0.85)';
            context.stroke();
        }

        context.fillStyle = '#17345a';
        context.fillRect(0, height * 0.94, width, height * 0.06);
        context.fillStyle = '#d4e4ff';
        context.font = `600 ${Math.max(15, width * 0.02)}px Segoe UI, Arial, sans-serif`;
        context.fillText('Калориметрдегі су мен мұз', width / 2, height * 0.92);

        context.fillStyle = '#ffafc0';
        context.font = `600 ${Math.max(15, width * 0.021)}px Segoe UI, Arial, sans-serif`;
        const phaseText = progress === 0 ? 'Тәжірибені бастауға дайын'
            : progress < 1 ? 'Мұз еріп, жылу алмасу жүріп жатыр'
                : 'Тепе-теңдік орнады';
        context.fillText(phaseText, width / 2, height * 0.17);
    };

    const resizeCanvas = () => {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        drawScene();
    };

    const animate = (time) => {
        if (running && !paused) {
            progress = Math.min(1, (time - startedAt) / duration);
            if (progress === 1) {
                running = false;
                pauseButton.disabled = true;
                startButton.disabled = false;
                Object.values(fields).forEach((field) => { field.disabled = false; });
                status.textContent = 'Тәжірибе аяқталды. Тепе-теңдік температурасын өлшеп, есепті тексер.';
            }
        }
        drawScene();
        if (overlay.classList.contains('is-open')) frameId = window.requestAnimationFrame(animate);
    };

    const openLab = async () => {
        if (running && paused) {
            startedAt += performance.now() - pausedAt;
            paused = false;
            updateControls();
        }
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lab-is-open');
        resizeCanvas();
        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(animate);
        if (overlay.requestFullscreen) {
            try {
                await overlay.requestFullscreen();
            } catch (error) {
                console.warn('Толық экран режимі қолжетімсіз:', error);
            }
        }
    };

    const closeLab = async () => {
        if (running && !paused) {
            pausedAt = performance.now();
            paused = true;
            updateControls();
        }
        window.cancelAnimationFrame(frameId);
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lab-is-open');
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (error) {
                console.warn('Толық экран режимінен шығу мүмкін болмады:', error);
            }
        }
    };

    startButton.addEventListener('click', () => {
        if (!validateParameters()) return;
        const measured = calculateResult();
        finalTemperature = measured.temperature;
        progress = 0;
        paused = false;
        running = true;
        startedAt = performance.now();
        pausedAt = 0;
        status.textContent = 'Су мұзға жылуын беріп жатыр. Термометр көрсеткішін бақыла.';
        result.textContent = measured.latentHeat === undefined
            ? `Соңғы температура: ${finalTemperature.toFixed(1)} °C · Мұз толық ерімеді`
            : `Соңғы температура: ${finalTemperature.toFixed(1)} °C · λ = ${Math.round(measured.latentHeat).toLocaleString('kk-KZ')} Дж/кг`;
        updateControls();
        drawScene();
    });

    pauseButton.addEventListener('click', () => {
        if (!running) return;
        if (paused) {
            startedAt += performance.now() - pausedAt;
            paused = false;
        } else {
            pausedAt = performance.now();
            paused = true;
        }
        updateControls();
    });

    stopButton.addEventListener('click', () => {
        running = false;
        paused = false;
        progress = 0;
        finalTemperature = null;
        status.textContent = 'Пуск батырмасын басып, мұздың еруін бақыла.';
        result.textContent = 'Соңғы температура: — · λ: —';
        updateControls();
        drawScene();
    });

    openButton.addEventListener('click', openLab);
    closeButton.addEventListener('click', closeLab);
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeLab();
    });
    overlay.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && overlay.classList.contains('is-open')) closeLab();
        resizeCanvas();
    });
    window.addEventListener('resize', resizeCanvas);
    updateControls();
    resizeCanvas();
}
