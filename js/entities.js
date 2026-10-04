/**
 * Plants vs. Math - Game Entities
 * Procedurally rendered characters and visual effects inspired by Plants vs. Zombies.
 */

// Helper to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
    if (radius === undefined) radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// ----------------------------------------------------
// PEASHOOTER
// ----------------------------------------------------
class Peashooter {
    constructor(x, y, lane = 0) {
        this.x = x;
        this.y = y;
        this.lane = lane;
        this.shootTimer = 0;
        this.animTime = Math.random() * 10;
        this.mouthStretch = 0;
        this.isShooting = false;
        this.blinkTimer = 2 + Math.random() * 3;
        this.isBlinking = false;
        this.hitFlash = 0;
        this.dead = false;
        this.isDouble = false;
    }

    update(dt) {
        if (this.dead) return;
        this.animTime += dt;
        if (this.mouthStretch > 0) {
            this.mouthStretch = Math.max(0, this.mouthStretch - dt * 4);
        }
        if (this.hitFlash > 0) {
            this.hitFlash = Math.max(0, this.hitFlash - dt);
        }

        // Blinking
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.isBlinking = true;
            if (this.blinkTimer <= -0.15) {
                this.isBlinking = false;
                this.blinkTimer = 2.5 + Math.random() * 3;
            }
        }
    }

    shoot() {
        if (this.dead) return;
        this.mouthStretch = 1.0;
    }

    render(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(1.5) sepia(1) hue-rotate(-50deg)';
        }

        const sway = Math.sin(this.animTime * 3) * 0.08;
        const bounce = Math.abs(Math.sin(this.animTime * 3)) * 4;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 32, 28, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base leaves on ground
        ctx.fillStyle = '#4CAF50';
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2.5;

        // Left leaf
        ctx.beginPath();
        ctx.ellipse(-16, 26, 14, 7, -0.2 + sway, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right leaf
        ctx.beginPath();
        ctx.ellipse(16, 26, 14, 7, 0.2 - sway, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Back leaf
        ctx.beginPath();
        ctx.ellipse(0, 30, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Stem
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#43A047';
        ctx.lineCap = 'round';
        ctx.moveTo(0, 26);
        ctx.quadraticCurveTo(Math.sin(this.animTime * 3) * 8 - 4, 10, -5, -6 - bounce);
        ctx.stroke();

        // Head group (affected by sway and stretch)
        ctx.save();
        ctx.translate(-5, -10 - bounce);
        ctx.rotate(sway);

        // Back leaf on head
        ctx.fillStyle = '#4CAF50';
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-26, -5, 12, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Extra leafy crest for Repeater Double Shot
        if (this.isDouble) {
            ctx.fillStyle = '#388E3C';
            ctx.strokeStyle = '#1B5E20';
            ctx.beginPath();
            ctx.ellipse(-29, -13, 13, 6, -0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(-25, 3, 11, 5, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Big head bulb
        const headGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, 26);
        headGrad.addColorStop(0, '#81C784');
        headGrad.addColorStop(0.5, '#4CAF50');
        headGrad.addColorStop(1, '#2E7D32');

        ctx.fillStyle = headGrad;
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Snout / Mouth (stretches when shooting!)
        const snoutLength = 16 + this.mouthStretch * 12;
        const snoutWidth = 14 - this.mouthStretch * 3;

        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.rect(8, -snoutWidth / 2, snoutLength, snoutWidth);
        ctx.fill();
        ctx.stroke();

        // Mouth opening (dark circular hole where pea pops out)
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.ellipse(8 + snoutLength, 0, 5 + this.mouthStretch * 4, snoutWidth / 2 + 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        // Eye Left
        ctx.beginPath();
        ctx.ellipse(2, -10, 6, this.isBlinking ? 1 : 8, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eye Right
        ctx.beginPath();
        ctx.ellipse(14, -8, 5, this.isBlinking ? 1 : 7, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupils looking right
        if (!this.isBlinking) {
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.arc(4, -10, 3, 0, Math.PI * 2);
            ctx.arc(15, -8, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Eye shine
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(5, -12, 1.2, 0, Math.PI * 2);
            ctx.arc(16, -10, 1.0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cute blush
        ctx.fillStyle = 'rgba(255, 138, 128, 0.4)';
        ctx.beginPath();
        ctx.arc(4, 3, 5, 0, Math.PI * 2);
        ctx.fill();

        // Repeater eyebrows & 2x badge
        if (this.isDouble) {
            ctx.strokeStyle = '#1B5E20';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-1, -17);
            ctx.lineTo(8, -15);
            ctx.moveTo(11, -15);
            ctx.lineTo(19, -13);
            ctx.stroke();

            // 2× badge above head
            ctx.save();
            ctx.fillStyle = '#FFD54F';
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 1.5;
            roundRect(ctx, -15, -34, 30, 13, 4);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#1B5E20';
            ctx.font = 'bold 9px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('2× PEA', 0, -27);
            ctx.restore();
        }

        ctx.restore();
        ctx.restore();
    }
}

// ----------------------------------------------------
// PEA PROJECTILE
// ----------------------------------------------------
class Pea {
    constructor(x, y, targetLane = 0, type = 'regular') {
        this.x = x;
        this.y = y;
        this.lane = targetLane;
        this.type = type; // 'regular', 'fire', 'ice'
        this.speed = 820; // pixels per second
        this.radius = type === 'fire' ? 12 : 9;
        this.isDead = false;
        this.trailTimer = 0;
        this.damage = type === 'fire' ? 2 : 1;
    }

    update(dt) {
        this.x += this.speed * dt;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'fire') {
            // Fiery Pea
            const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radius);
            grad.addColorStop(0, '#FFF59D');
            grad.addColorStop(0.4, '#FF9800');
            grad.addColorStop(0.9, '#F44336');
            grad.addColorStop(1, '#B71C1C');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Flame glow
            ctx.shadowColor = '#FF5722';
            ctx.shadowBlur = 15;
            ctx.stroke();
        } else if (this.type === 'ice') {
            // Frosty Ice Pea
            const grad = ctx.createRadialGradient(-2, -2, 2, 0, 0, this.radius);
            grad.addColorStop(0, '#E0F7FA');
            grad.addColorStop(0.5, '#4DD0E1');
            grad.addColorStop(1, '#00838F');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowColor = '#00E5FF';
            ctx.shadowBlur = 12;
            ctx.stroke();
        } else {
            // Regular Green Pea
            const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radius);
            grad.addColorStop(0, '#C8E6C9');
            grad.addColorStop(0.4, '#4CAF50');
            grad.addColorStop(1, '#1B5E20');

            ctx.fillStyle = grad;
            ctx.strokeStyle = '#0D5302';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Shiny highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ----------------------------------------------------
// ZOMBIE
// ----------------------------------------------------
class Zombie {
    constructor(x, y, lane = 0, type = 'regular', baseSpeed = 28) {
        this.x = x;
        this.y = y;
        this.lane = lane;
        this.type = type; // 'regular', 'conehead', 'buckethead', 'flag'

        // Hit points configuration
        if (type === 'buckethead') {
            this.hp = 3;
            this.maxHp = 3;
            this.speed = baseSpeed * 0.9;
        } else if (type === 'conehead') {
            this.hp = 2;
            this.maxHp = 2;
            this.speed = baseSpeed * 0.95;
        } else if (type === 'flag') {
            this.hp = 1;
            this.maxHp = 1;
            this.speed = baseSpeed * 1.25;
        } else {
            this.hp = 1;
            this.maxHp = 1;
            this.speed = baseSpeed;
        }

        this.walkCycle = Math.random() * 10;
        this.hitFlashTimer = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.isDead = false;
        this.deathTimer = 0;
        this.isFrozen = false;
        this.frozenTimer = 0;
        this.armorPopped = false;
    }

    update(dt, speedMultiplier, attackThresholdX) {
        if (this.isDead) {
            this.deathTimer += dt;
            return;
        }

        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            if (this.frozenTimer <= 0) {
                this.isFrozen = false;
            }
        }

        // Attack check: reached the plant defense line
        if (this.x <= attackThresholdX) {
            this.isAttacking = true;
            this.attackTimer += dt;
        } else {
            this.isAttacking = false;
            const currentSpeed = this.isFrozen ? this.speed * 0.5 : this.speed;
            this.x -= currentSpeed * speedMultiplier * dt;
            this.walkCycle += dt * (currentSpeed / 20) * speedMultiplier;
        }
    }

    takeHit(damage, isIce = false) {
        this.hp -= damage;
        this.hitFlashTimer = 0.15;
        this.x += 12; // Slight knockback

        if (isIce) {
            this.isFrozen = true;
            this.frozenTimer = 3.5;
        }

        if (this.hp <= 0) {
            this.isDead = true;
            return { killed: true, droppedArmor: false };
        }

        // Check if cone or bucket flew off
        let droppedArmor = false;
        if (!this.armorPopped && (this.type === 'conehead' || this.type === 'buckethead')) {
            if (this.hp === 1) {
                this.armorPopped = true;
                droppedArmor = true;
            }
        }

        return { killed: false, droppedArmor };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isDead) {
            // Fade out and fall over
            const alpha = Math.max(0, 1 - this.deathTimer * 2.2);
            ctx.globalAlpha = alpha;
            ctx.rotate(this.deathTimer * 2.5);
            ctx.translate(0, this.deathTimer * 20);
        }

        if (this.hitFlashTimer > 0) {
            ctx.filter = 'brightness(2.2)';
        } else if (this.isFrozen) {
            ctx.filter = 'hue-rotate(160deg) saturate(1.8)';
        }

        const limp = Math.sin(this.walkCycle * 4);
        const legSway = Math.sin(this.walkCycle * 4) * 0.35;
        const armSway = Math.cos(this.walkCycle * 4) * 0.4;
        const chompOffset = this.isAttacking ? Math.sin(this.attackTimer * 10) * 8 : 0;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 36, 24, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Back Arm
        ctx.save();
        ctx.translate(-5, 0);
        ctx.rotate(-0.8 + armSway);
        ctx.fillStyle = '#6D4C41'; // Coat sleeve
        ctx.fillRect(-4, 0, 9, 20);
        // Hand
        ctx.fillStyle = '#9E9D24';
        ctx.beginPath();
        ctx.arc(0, 22, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Left Leg (Back)
        ctx.save();
        ctx.translate(-6, 22);
        ctx.rotate(-legSway);
        ctx.fillStyle = '#263238'; // Dark pants
        ctx.fillRect(-4, 0, 8, 18);
        // Shoe
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(-6, 16, 12, 6);
        ctx.restore();

        // Right Leg (Front)
        ctx.save();
        ctx.translate(6, 22);
        ctx.rotate(legSway);
        ctx.fillStyle = '#37474F';
        ctx.fillRect(-4, 0, 8, 18);
        // Exposed green foot/bare toe
        ctx.fillStyle = '#827717';
        ctx.fillRect(-5, 16, 11, 6);
        ctx.restore();

        // Body / Ragged Coat
        ctx.fillStyle = '#795548';
        roundRect(ctx, -14, -2, 28, 26, 4);
        ctx.fill();

        // White Shirt Collar & Red Necktie
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(6, -2);
        ctx.lineTo(0, 7);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#D32F2F'; // Red tie
        ctx.beginPath();
        ctx.moveTo(-3, 3);
        ctx.lineTo(3, 3);
        ctx.lineTo(4, 18);
        ctx.lineTo(0, 22);
        ctx.lineTo(-4, 18);
        ctx.closePath();
        ctx.fill();

        // Front Arm (reaching forward!)
        ctx.save();
        ctx.translate(6, 2);
        ctx.rotate(this.isAttacking ? -1.4 + chompOffset * 0.05 : -1.1 - armSway * 0.4);
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(-4, 0, 9, 24);
        // Green claw hand
        ctx.fillStyle = '#9E9D24';
        ctx.beginPath();
        ctx.arc(0, 24, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Zombie Head Group
        ctx.save();
        ctx.translate(-3, -16 + limp * 1.5);
        ctx.rotate(this.isAttacking ? -0.2 + chompOffset * 0.04 : 0.08);

        // Head Base
        const headGrad = ctx.createRadialGradient(-4, -4, 4, 0, 0, 22);
        headGrad.addColorStop(0, '#CDDC39');
        headGrad.addColorStop(0.6, '#9E9D24');
        headGrad.addColorStop(1, '#827717');

        ctx.fillStyle = headGrad;
        ctx.strokeStyle = '#558B2F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Goofy asymmetrical Zombie Eyes
        // Left Big Eye
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-8, -4, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#33691E';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Right Small Eye
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(5, -6, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tiny Pupils looking at player
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-9.5, -4, 2, 0, Math.PI * 2);
        ctx.arc(4, -6, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Zombie Mouth / Teeth (Chomping motion)
        const mouthOpen = this.isAttacking ? 5 + Math.abs(chompOffset) : 3;
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(-4, 8, 8, mouthOpen, 0, 0, Math.PI * 2);
        ctx.fill();

        // Yellow jagged teeth
        ctx.fillStyle = '#FFF9C4';
        ctx.fillRect(-9, 6, 3, 3);
        ctx.fillRect(-4, 6, 3, 4);
        ctx.fillRect(1, 6, 3, 3);

        // A few wisps of zombie hair
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, -18);
        ctx.quadraticCurveTo(-6, -26, -10, -24);
        ctx.moveTo(2, -18);
        ctx.quadraticCurveTo(4, -28, 8, -25);
        ctx.stroke();

        // Armor Rendering: Cone or Bucket or Flag
        if (this.type === 'conehead' && this.hp > 1) {
            // Orange Traffic Cone
            ctx.save();
            ctx.translate(0, -18);
            ctx.rotate(0.1);

            // Cone base rim
            ctx.fillStyle = '#E65100';
            ctx.fillRect(-16, -2, 32, 5);

            // Cone triangle
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.moveTo(-13, -2);
            ctx.lineTo(13, -2);
            ctx.lineTo(3, -34);
            ctx.lineTo(-3, -34);
            ctx.closePath();
            ctx.fill();

            // White reflective stripe
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(-9, -12);
            ctx.lineTo(9, -12);
            ctx.lineTo(6, -22);
            ctx.lineTo(-6, -22);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        } else if (this.type === 'buckethead' && this.hp > 1) {
            // Silver Metal Bucket
            ctx.save();
            ctx.translate(0, -18);

            const bucketGrad = ctx.createLinearGradient(-14, 0, 14, 0);
            bucketGrad.addColorStop(0, '#78909C');
            bucketGrad.addColorStop(0.5, '#ECEFF1');
            bucketGrad.addColorStop(1, '#546E7A');

            ctx.fillStyle = bucketGrad;
            ctx.strokeStyle = '#37474F';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(-16, 2);
            ctx.lineTo(16, 2);
            ctx.lineTo(12, -26);
            ctx.lineTo(-12, -26);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Bucket handle
            ctx.strokeStyle = '#455A64';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, -4, 18, Math.PI * 0.8, Math.PI * 0.2, true);
            ctx.stroke();

            ctx.restore();
        } else if (this.type === 'flag') {
            // Brain Flag
            ctx.save();
            ctx.translate(14, -14);
            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 30);
            ctx.lineTo(0, -32);
            ctx.stroke();

            // Flag cloth with brain
            ctx.fillStyle = '#F44336';
            ctx.fillRect(0, -32, 24, 18);
            // Brain silhouette on flag
            ctx.fillStyle = '#FFCDD2';
            ctx.beginPath();
            ctx.arc(12, -23, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore(); // end head group

        // Zombie Health Bar (if damaged or multi-hit)
        if (this.maxHp > 1 && !this.isDead) {
            const barW = 34;
            const barH = 5;
            const barX = -barW / 2;
            const barY = -48;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

            const fillRatio = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = fillRatio > 0.5 ? '#76FF03' : (fillRatio > 0.25 ? '#FFD600' : '#FF1744');
            ctx.fillRect(barX, barY, barW * fillRatio, barH);
        }

        ctx.restore();
    }
}

// ----------------------------------------------------
// IMP ZOMBIE (TINY & QUICK)
// ----------------------------------------------------
class ImpZombie extends Zombie {
    constructor(x, y, lane = 0, baseSpeed = 42) {
        super(x, y, lane, 'imp', baseSpeed);
        this.hp = 1;
        this.maxHp = 1;
        this.scale = 0.72;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.translate(0, 10);

        if (this.isDead) {
            const alpha = Math.max(0, 1 - this.deathTimer * 2.5);
            ctx.globalAlpha = alpha;
            ctx.rotate(this.deathTimer * 3.0);
            ctx.translate(0, this.deathTimer * 25);
        }

        if (this.hitFlashTimer > 0) {
            ctx.filter = 'brightness(2.2)';
        } else if (this.isFrozen) {
            ctx.filter = 'hue-rotate(160deg) saturate(1.8)';
        }

        const limp = Math.sin(this.walkCycle * 6);
        const legSway = Math.sin(this.walkCycle * 6) * 0.45;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 36, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Little Legs
        ctx.fillStyle = '#263238';
        ctx.fillRect(-6, 22, 5, 14);
        ctx.fillRect(2, 22, 5, 14);

        // Little ragged overalls
        ctx.fillStyle = '#1565C0';
        roundRect(ctx, -10, 4, 20, 20, 3);
        ctx.fill();

        // Big head on tiny body
        ctx.save();
        ctx.translate(0, -6 + limp * 2);
        const headGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
        headGrad.addColorStop(0, '#DCE775');
        headGrad.addColorStop(0.6, '#9E9D24');
        headGrad.addColorStop(1, '#827717');
        ctx.fillStyle = headGrad;
        ctx.strokeStyle = '#558B2F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Goofy eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-5, -3, 6, 0, Math.PI * 2);
        ctx.arc(5, -3, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-6, -3, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Buck teeth mouth
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(0, 6, 6, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#FFFDE7';
        ctx.fillRect(-3, 6, 3, 4);
        ctx.fillRect(1, 6, 3, 4);

        // Propeller beanie on head
        ctx.fillStyle = '#E53935';
        ctx.fillRect(-8, -16, 16, 5);
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(-2, -21, 4, 6);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(-10, -23, 20, 3);

        ctx.restore();
        ctx.restore();
    }
}

// ----------------------------------------------------
// GARGANTUAR BOSS ZOMBIE
// ----------------------------------------------------
class BossZombie extends Zombie {
    constructor(x, y, lane = 1, baseSpeed = 16) {
        super(x, y, lane, 'boss', baseSpeed);
        this.hp = 16;
        this.maxHp = 16;
        this.isBoss = true;
        this.hasThrownImp = false;
        this.thudTimer = 0;
        this.scale = 1.65;
        this.impThrowPending = false;
    }

    takeHit(damage, isIce = false, isLethal = false) {
        // Lawnmower or Super Hot Chili Pepper is instant defeat; Cherry Bomb does 6 massive damage
        const actualDamage = isLethal ? 999 : (damage > 10 ? 6 : damage);
        this.hp -= actualDamage;
        this.hitFlashTimer = 0.2;
        this.x += (isLethal ? 0 : 4); // Slight knockback

        if (isIce) {
            this.isFrozen = true;
            this.frozenTimer = 2.0;
        }

        // Check Imp throw threshold (at <= 50% HP)
        if (this.hp <= this.maxHp / 2 && !this.hasThrownImp) {
            this.hasThrownImp = true;
            this.impThrowPending = true;
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            return { killed: true, droppedArmor: false };
        }

        return { killed: false, droppedArmor: false };
    }

    update(dt, speedMultiplier, attackThresholdX) {
        super.update(dt, speedMultiplier, attackThresholdX);
        if (!this.isDead && !this.isAttacking) {
            this.thudTimer += dt * speedMultiplier;
            if (this.thudTimer >= 1.3) {
                this.thudTimer = 0;
                window.soundEffects.playBossThud();
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        ctx.translate(0, -6);

        if (this.isDead) {
            const alpha = Math.max(0, 1 - this.deathTimer * 1.5);
            ctx.globalAlpha = alpha;
            ctx.rotate(this.deathTimer * 1.2);
            ctx.translate(0, this.deathTimer * 15);
        }

        if (this.hitFlashTimer > 0) {
            ctx.filter = 'brightness(2.2)';
        } else if (this.isFrozen) {
            ctx.filter = 'hue-rotate(160deg) saturate(1.8)';
        }

        const limp = Math.sin(this.walkCycle * 3);
        const legSway = Math.sin(this.walkCycle * 3) * 0.3;
        const armSway = Math.cos(this.walkCycle * 3) * 0.3;

        // Giant Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 38, 34, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Basket on back (carrying Imp before throw)
        ctx.fillStyle = '#6D4C41';
        roundRect(ctx, 10, -22, 16, 26, 4);
        ctx.fill();
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Imp peeking out of basket if not thrown yet!
        if (!this.hasThrownImp) {
            ctx.save();
            ctx.translate(18, -26);
            ctx.scale(0.5, 0.5);
            ctx.fillStyle = '#9E9D24';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            // Imp eyes
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(-4, -2, 4, 0, Math.PI * 2);
            ctx.arc(4, -2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-4, -2, 1.5, 0, Math.PI * 2);
            ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Heavy Left Leg
        ctx.save();
        ctx.translate(-8, 22);
        ctx.rotate(-legSway);
        ctx.fillStyle = '#37474F';
        ctx.fillRect(-6, 0, 12, 22);
        ctx.fillStyle = '#212121';
        ctx.fillRect(-8, 18, 16, 8); // Heavy boot
        ctx.restore();

        // Heavy Right Leg
        ctx.save();
        ctx.translate(8, 22);
        ctx.rotate(legSway);
        ctx.fillStyle = '#455A64';
        ctx.fillRect(-6, 0, 12, 22);
        ctx.fillStyle = '#212121';
        ctx.fillRect(-8, 18, 16, 8);
        ctx.restore();

        // Massive Torso / Stitched Overalls
        ctx.fillStyle = '#546E7A';
        roundRect(ctx, -22, -18, 44, 42, 6);
        ctx.fill();

        // Metal rivets and stitched patches
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(-10, 16);
        ctx.moveTo(10, -10);
        ctx.lineTo(10, 16);
        ctx.stroke();

        // Giant Gargantuar Head
        ctx.save();
        ctx.translate(-2, -32 + limp * 1.2);

        const headGrad = ctx.createRadialGradient(-6, -6, 5, 0, 0, 26);
        headGrad.addColorStop(0, '#90A4AE');
        headGrad.addColorStop(0.6, '#607D8B');
        headGrad.addColorStop(1, '#455A64');

        ctx.fillStyle = headGrad;
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Riveted metal brow plate
        ctx.fillStyle = '#CFD8DC';
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = 2;
        ctx.fillRect(-22, -12, 44, 9);
        ctx.strokeRect(-22, -12, 44, 9);
        // Rivet dots
        ctx.fillStyle = '#263238';
        ctx.beginPath();
        ctx.arc(-16, -7, 1.5, 0, Math.PI * 2);
        ctx.arc(-5, -7, 1.5, 0, Math.PI * 2);
        ctx.arc(6, -7, 1.5, 0, Math.PI * 2);
        ctx.arc(16, -7, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Menacing glowing yellow eyes
        ctx.fillStyle = '#FFEA00';
        ctx.beginPath();
        ctx.arc(-8, 3, 5, 0, Math.PI * 2);
        ctx.arc(8, 2, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#D50000';
        ctx.beginPath();
        ctx.arc(-9, 3, 2, 0, Math.PI * 2);
        ctx.arc(7, 2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Brutal underbite jaws
        ctx.fillStyle = '#1A237E';
        ctx.fillRect(-12, 12, 24, 7);
        ctx.fillStyle = '#FFF8E1';
        ctx.beginPath();
        ctx.moveTo(-10, 19); ctx.lineTo(-8, 12); ctx.lineTo(-6, 19);
        ctx.moveTo(-4, 19); ctx.lineTo(-2, 11); ctx.lineTo(0, 19);
        ctx.moveTo(2, 19); ctx.lineTo(4, 12); ctx.lineTo(6, 19);
        ctx.fill();

        ctx.restore(); // end head

        // Massive Left Arm holding Giant Telephone Pole
        ctx.save();
        ctx.translate(-14, -8);
        ctx.rotate(this.isAttacking ? -0.8 + Math.sin(this.attackTimer * 6) * 0.4 : -0.2 + armSway * 0.3);

        ctx.fillStyle = '#78909C';
        roundRect(ctx, -8, 0, 16, 32, 6);
        ctx.fill();

        // Giant Telephone Pole Weapon
        ctx.fillStyle = '#5D4037';
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2.5;
        roundRect(ctx, -14, -46, 12, 85, 3);
        ctx.fill();
        ctx.stroke();

        // Crossbeam at top of pole with insulator pegs
        ctx.fillRect(-28, -42, 40, 8);
        ctx.strokeRect(-28, -42, 40, 8);
        ctx.fillStyle = '#ECEFF1';
        ctx.fillRect(-26, -49, 6, 7);
        ctx.fillRect(4, -49, 6, 7);

        // Hanging power wires
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-23, -42);
        ctx.quadraticCurveTo(-15, -28, -5, -42);
        ctx.stroke();

        ctx.restore();

        ctx.restore();
    }
}

// ----------------------------------------------------
// LAWNMOWER
// ----------------------------------------------------
class Lawnmower {
    constructor(x, y, lane = 0) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.lane = lane;
        this.state = 'idle'; // 'idle', 'moving', 'spent'
        this.speed = 850;
        this.bladeAngle = 0;
    }

    trigger() {
        if (this.state === 'idle') {
            this.state = 'moving';
            return true;
        }
        return false;
    }

    update(dt, canvasWidth) {
        if (this.state === 'moving') {
            this.x += this.speed * dt;
            this.bladeAngle += dt * 30;
            if (this.x > canvasWidth + 100) {
                this.state = 'spent';
            }
        }
    }

    render(ctx) {
        if (this.state === 'spent') return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 24, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lawnmower Red Body
        const bodyGrad = ctx.createLinearGradient(0, -10, 0, 18);
        bodyGrad.addColorStop(0, '#E53935');
        bodyGrad.addColorStop(1, '#B71C1C');

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#7F0000';
        ctx.lineWidth = 2;
        roundRect(ctx, -24, 2, 48, 16, 5);
        ctx.fill();
        ctx.stroke();

        // Engine block (metallic silver/black)
        ctx.fillStyle = '#424242';
        ctx.fillRect(-10, -10, 20, 14);
        ctx.fillStyle = '#BDBDBD';
        ctx.fillRect(-6, -14, 12, 5);

        // Handlebars
        ctx.strokeStyle = '#ECEFF1';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-16, 6);
        ctx.lineTo(-32, -18);
        ctx.lineTo(-40, -18);
        ctx.stroke();

        // Wheels
        ctx.fillStyle = '#212121';
        ctx.strokeStyle = '#757575';
        ctx.lineWidth = 2;
        // Back wheel
        ctx.beginPath();
        ctx.arc(-18, 18, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Front wheel
        ctx.beginPath();
        ctx.arc(18, 18, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Spinning blades in front
        ctx.save();
        ctx.translate(26, 12);
        ctx.rotate(this.bladeAngle);
        ctx.strokeStyle = '#B0BEC5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
}

// ----------------------------------------------------
// PARTICLES & FLOATING TEXT
// ----------------------------------------------------
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    addSplat(x, y, color = '#4CAF50', count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 160;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2.5 + Math.random() * 4,
                color,
                alpha: 1.0,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.6
            });
        }
    }

    addArmorPop(x, y, type = 'cone') {
        const color = type === 'cone' ? '#FF9800' : '#CFD8DC';
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 200,
                vy: -150 - Math.random() * 150,
                radius: 5 + Math.random() * 4,
                color,
                alpha: 1.0,
                life: 0.6,
                maxLife: 0.6
            });
        }
    }

    addFloatingText(text, x, y, color = '#FFD54F', size = 20) {
        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -55,
            color,
            size,
            alpha: 1.0,
            life: 0.8
        });
    }

    update(dt) {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.isRing) {
                p.radius += (p.maxRadius - p.radius) * dt * 10;
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 300 * dt; // Gravity
            }
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy * dt;
            t.life -= dt;
            t.alpha = Math.max(0, t.life / 0.8);
            if (t.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    render(ctx) {
        // Draw particles
        ctx.save();
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            if (p.isRing) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 8 * p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        // Draw floating texts
        ctx.save();
        for (const t of this.floatingTexts) {
            ctx.globalAlpha = t.alpha;
            ctx.font = `bold ${t.size}px "Segoe UI", Arial, sans-serif`;
            ctx.textAlign = 'center';

            // Text stroke
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(t.text, t.x, t.y);

            // Text fill
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.restore();
    }

    addExplosion(x, y, radius = 135) {
        // Shockwave ring
        this.particles.push({
            x,
            y,
            vx: 0,
            vy: 0,
            radius: 10,
            maxRadius: radius,
            color: '#FFD54F',
            isRing: true,
            alpha: 1.0,
            life: 0.5,
            maxLife: 0.5
        });

        // Fiery explosive sparks and smoke
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 260;
            const colors = ['#FF1744', '#FF5722', '#FF9800', '#FFEA00', '#3E2723'];
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 7,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.0,
                life: 0.5 + Math.random() * 0.4,
                maxLife: 0.8
            });
        }

        // Comic BOOM text!
        this.addFloatingText('💥 BOOM!', x, y - 20, '#FF1744', 36);
    }

    // Super Hot Chili Pepper board-wide inferno explosion
    addChiliInferno(laneHeights, startX = 130, endX = 1000) {
        const centerX = (startX + endX) / 2;
        const centerY = laneHeights[Math.floor(laneHeights.length / 2)] || 320;

        // 1. Massive expanding shockwave rings centered across the battlefield
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: 0,
                vy: 0,
                radius: 25 + i * 35,
                maxRadius: 680,
                color: i === 0 ? '#FFFFFF' : (i === 1 ? '#FFD54F' : (i === 2 ? '#FF5722' : '#FF1744')),
                isRing: true,
                alpha: 1.0,
                life: 0.75,
                maxLife: 0.75
            });
        }

        // 2. Roaring fire pillars and flame tongues sweeping through all 5 lanes
        laneHeights.forEach((laneY) => {
            for (let x = startX + 30; x <= endX; x += 95) {
                // Expanding fire blast ring on each lane position
                this.particles.push({
                    x: x,
                    y: laneY,
                    vx: 0,
                    vy: 0,
                    radius: 12,
                    maxRadius: 95,
                    color: '#FF5722',
                    isRing: true,
                    alpha: 0.95,
                    life: 0.6,
                    maxLife: 0.6
                });

                // Fiery flame sparks leaping upward
                for (let p = 0; p < 7; p++) {
                    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
                    const speed = 80 + Math.random() * 220;
                    const colors = ['#FFFFFF', '#FFEB3B', '#FF9800', '#FF3D00', '#D50000'];
                    this.particles.push({
                        x: x + (Math.random() - 0.5) * 35,
                        y: laneY + (Math.random() - 0.5) * 18,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 60,
                        radius: 5 + Math.random() * 8,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        alpha: 1.0,
                        life: 0.55 + Math.random() * 0.4,
                        maxLife: 0.95
                    });
                }
            }
        });

        // 3. Comic fiery banner announcements
        this.addFloatingText('🌶️🔥 JALAPENO INFERNO! 🔥🌶️', centerX, centerY - 80, '#FF3D00', 44);
        this.addFloatingText('💥 ALL ZOMBIES INCINERATED! 💥', centerX, centerY - 30, '#FFD600', 28);
    }
}

// ----------------------------------------------------
// SUN ORB (COLLECTIBLE SUN POINTS)
// ----------------------------------------------------
class SunOrb {
    constructor(x, y, targetX = 90, targetY = 25, isMultiple = false, number = null, isValidMultiple = false, pairId = null) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.isMultiple = isMultiple;
        this.number = number;
        this.isValidMultiple = isValidMultiple;
        this.pairId = pairId;
        this.radius = isMultiple ? 24 : 20;
        this.rotation = Math.random() * Math.PI * 2;
        this.alpha = 1.0;
        this.fading = false;
        this.dead = false;

        if (this.isMultiple) {
            this.state = 'floating_up'; // floats straight to top zone
            this.floatY = targetY;
        } else {
            this.state = 'spawning'; // 'spawning', 'hovering', 'flying'
            this.vy = -140; // Initial hop upwards
            this.floatY = y;
        }
        this.collected = false;
        this.life = 0;
    }

    fadeAway() {
        this.fading = true;
    }

    update(dt) {
        this.life += dt;
        this.rotation += dt * 1.8;

        if (this.fading) {
            this.alpha = Math.max(0, this.alpha - dt * 2.8);
            if (this.alpha <= 0) {
                this.dead = true;
            }
            return;
        }

        if (this.isMultiple) {
            if (this.state === 'floating_up') {
                const dy = this.targetY - this.y;
                const dx = this.targetX - this.x;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 10) {
                    this.x = this.targetX;
                    this.y = this.targetY;
                    this.floatY = this.y;
                    this.state = 'hovering_top';
                    this.timer = 0;
                } else {
                    const speed = 220;
                    this.x += (dx / dist) * speed * dt;
                    this.y += (dy / dist) * speed * dt;
                }
            } else if (this.state === 'hovering_top') {
                this.timer += dt;
                // Gentle floating bob in top zone
                this.y = this.floatY + Math.sin(this.life * 3.5) * 4;

                // Stays for 12 seconds; if unclicked, gently fades out
                if (this.timer > 9) {
                    this.alpha = Math.max(0, 1 - (this.timer - 9) / 3);
                    if (this.timer >= 12) {
                        this.dead = true;
                    }
                }
            } else if (this.state === 'flying') {
                const hudTargetX = 120;
                const hudTargetY = 25;
                const dx = hudTargetX - this.x;
                const dy = hudTargetY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const speed = Math.max(500, dist * 5.0);
                if (dist < 25) {
                    this.collected = true;
                } else {
                    this.x += (dx / dist) * speed * dt;
                    this.y += (dy / dist) * speed * dt;
                }
            }
            return;
        }

        // Standard classic sun behavior
        if (this.state === 'spawning') {
            this.y += this.vy * dt;
            this.vy += 220 * dt; // Gravity
            if (this.vy >= 0 && this.y >= this.startY - 30) {
                this.state = 'hovering';
                this.floatY = this.y;
                this.timer = 0;
            }
        } else if (this.state === 'hovering') {
            this.timer += dt;
            this.y = this.floatY + Math.sin(this.life * 4) * 6;
            // After 1.6s of hovering, automatically fly to HUD sun counter
            if (this.timer > 1.6) {
                this.state = 'flying';
            }
        } else if (this.state === 'flying') {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = Math.max(500, dist * 4.0);
            if (dist < 25) {
                this.collected = true;
            } else {
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
            }
        }
    }

    containsPoint(px, py) {
        if (this.dead || this.fading) return false;
        const dx = px - this.x;
        const dy = py - this.y;
        return (dx * dx + dy * dy) <= (this.radius + 18) * (this.radius + 18);
    }

    collect() {
        if (!this.collected && !this.fading) {
            this.state = 'flying';
        }
    }

    render(ctx) {
        if (this.dead) return;
        ctx.save();
        if (this.alpha < 1.0) {
            ctx.globalAlpha = Math.max(0, this.alpha);
        }
        ctx.translate(this.x, this.y);

        // Sun Glow aura
        ctx.shadowColor = '#FFEB3B';
        ctx.shadowBlur = this.isMultiple ? 22 : 18;

        // Rotating Sun Rays (8 triangular rays)
        ctx.save();
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#FFA000';
        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(-7, -this.radius);
            ctx.lineTo(0, -this.radius - (this.isMultiple ? 12 : 10));
            ctx.lineTo(7, -this.radius);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Central Sun Sphere
        const sunGrad = ctx.createRadialGradient(-5, -5, 3, 0, 0, this.radius);
        sunGrad.addColorStop(0, '#FFFF8D');
        sunGrad.addColorStop(0.6, '#FFD54F');
        sunGrad.addColorStop(1, '#FFB300');

        ctx.fillStyle = sunGrad;
        ctx.strokeStyle = '#FF8F00';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (this.isMultiple && this.number !== null) {
            // Contrast circle badge in center
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Bold Number in center
            ctx.fillStyle = '#BF360C';
            ctx.font = '900 17px "Arial Rounded MT Bold", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(this.number), 0, 1);
        } else {
            // Cute smiling face on standard sun
            ctx.fillStyle = '#E65100';
            ctx.beginPath();
            ctx.arc(-6, -3, 2.5, 0, Math.PI * 2);
            ctx.arc(6, -3, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 2, 7, 0.2, Math.PI - 0.2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 112, 67, 0.5)';
            ctx.beginPath();
            ctx.arc(-10, 3, 3, 0, Math.PI * 2);
            ctx.arc(10, 3, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ----------------------------------------------------
// CHERRY BOMB (PLANTABLE EXPLOSIVE)
// ----------------------------------------------------
class CherryBomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 135; // Blast radius
        this.timer = 0;
        this.fuseTime = 0.9; // Detonates after 0.9 seconds
        this.isExploded = false;
        this.dead = false;
        this.animPhase = 0;
    }

    update(dt) {
        this.timer += dt;
        this.animPhase += dt * 30; // Tremble speed
        if (this.timer >= this.fuseTime && !this.isExploded) {
            this.isExploded = true;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const progress = Math.min(1.0, this.timer / this.fuseTime);
        const scale = 1.0 + progress * 0.45; // Swelling up!
        const shakeX = (Math.random() - 0.5) * (progress * 8);
        const shakeY = (Math.random() - 0.5) * (progress * 8);

        ctx.translate(shakeX, shakeY);
        ctx.scale(scale, scale);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 24, 30, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stems & Leaf
        ctx.strokeStyle = '#33691E';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Left stem
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.quadraticCurveTo(-15, -12, -14, 2);
        ctx.stroke();

        // Right stem
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.quadraticCurveTo(15, -12, 14, 2);
        ctx.stroke();

        // Stem joint leaf
        ctx.fillStyle = '#558B2F';
        ctx.beginPath();
        ctx.ellipse(-4, -22, 10, 5, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Sizzling fuse sparks at the joint
        if (progress > 0.15) {
            ctx.fillStyle = progress > 0.6 ? '#FFEB3B' : '#FF9800';
            ctx.shadowColor = '#FF5722';
            ctx.shadowBlur = 12;
            for (let i = 0; i < 3; i++) {
                const sparkAngle = Math.random() * Math.PI * 2;
                const sparkDist = 6 + Math.random() * 8;
                ctx.beginPath();
                ctx.arc(Math.cos(sparkAngle) * sparkDist, -22 + Math.sin(sparkAngle) * sparkDist, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Color shifts from dark red to flashing fiery bright red/orange
        const isFlashing = progress > 0.45 && Math.floor(this.animPhase) % 2 === 0;
        const cherryColor1 = isFlashing ? '#FF5722' : '#D32F2F';
        const cherryColor2 = isFlashing ? '#FF8A80' : '#880E4F';

        // Left Cherry
        ctx.save();
        ctx.translate(-14, 8);
        let gradL = ctx.createRadialGradient(-4, -4, 2, 0, 0, 18);
        gradL.addColorStop(0, '#FF8A80');
        gradL.addColorStop(0.4, cherryColor1);
        gradL.addColorStop(1, cherryColor2);

        ctx.fillStyle = gradL;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Angry Eyes on Left Cherry
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-4, -3, 4.5, 0, Math.PI * 2);
        ctx.arc(4, -3, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-2, -3, 2, 0, Math.PI * 2);
        ctx.arc(6, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Angry slanted eyebrow
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(8, -5);
        ctx.stroke();

        // Grimace mouth
        ctx.fillStyle = '#212121';
        ctx.fillRect(-5, 4, 10, 3);
        ctx.restore();

        // Right Cherry
        ctx.save();
        ctx.translate(14, 8);
        let gradR = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
        gradR.addColorStop(0, '#FF8A80');
        gradR.addColorStop(0.4, cherryColor1);
        gradR.addColorStop(1, cherryColor2);

        ctx.fillStyle = gradR;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Angry Eyes on Right Cherry
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-4, -3, 4.5, 0, Math.PI * 2);
        ctx.arc(4, -3, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-5, -3, 2, 0, Math.PI * 2);
        ctx.arc(3, -3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Angry slanted eyebrow
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -5);
        ctx.lineTo(8, -8);
        ctx.stroke();

        // Grimace mouth
        ctx.fillStyle = '#212121';
        ctx.fillRect(-5, 4, 10, 3);
        ctx.restore();

        ctx.restore();
    }
}

// ----------------------------------------------------
// SUPER HOT CHILI PEPPER (JALAPENO SCREEN-CLEARING UPGRADE)
// ----------------------------------------------------
class ChiliPepper {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.timer = 0;
        this.fuseTime = 1.0; // Detonates after 1.0 seconds
        this.isExploded = false;
        this.dead = false;
        this.animPhase = 0;
    }

    update(dt) {
        this.timer += dt;
        this.animPhase += dt * 35; // Fast furious tremble
        if (this.timer >= this.fuseTime && !this.isExploded) {
            this.isExploded = true;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const progress = Math.min(1.0, this.timer / this.fuseTime);
        const scale = 1.0 + progress * 0.55; // Swell dramatically up!
        const shakeX = (Math.random() - 0.5) * (progress * 12);
        const shakeY = (Math.random() - 0.5) * (progress * 12);

        ctx.translate(shakeX, shakeY);
        ctx.scale(scale, scale);

        // Ground shadow (radiates heat)
        ctx.fillStyle = progress > 0.5 ? 'rgba(255, 60, 0, 0.4)' : 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 26, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fiery heat aura when swelling
        if (progress > 0.2) {
            ctx.shadowColor = progress > 0.7 ? '#FFD600' : '#FF1744';
            ctx.shadowBlur = 15 + progress * 25;
        }

        // Sizzling fiery sparks shooting from stem and body
        if (progress > 0.1) {
            const sparkCount = Math.floor(3 + progress * 6);
            for (let i = 0; i < sparkCount; i++) {
                const sAngle = Math.random() * Math.PI * 2;
                const sDist = 10 + Math.random() * 22;
                const sY = -15 + Math.sin(sAngle) * sDist;
                const sX = Math.cos(sAngle) * (sDist * 0.6);
                ctx.fillStyle = Math.random() > 0.5 ? '#FFF59D' : '#FF5722';
                ctx.beginPath();
                ctx.arc(sX, sY, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Rising steam/smoke puffs
        if (progress > 0.3) {
            ctx.fillStyle = 'rgba(255, 235, 59, 0.35)';
            ctx.beginPath();
            ctx.arc((Math.sin(this.animPhase * 0.5) * 6), -34 - progress * 10, 5 + progress * 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Color shifting: vibrant chili red -> fiery bright orange -> flashing blazing yellow-white
        const isFlashing = progress > 0.55 && Math.floor(this.animPhase) % 2 === 0;
        let cBodyTop = '#FF1744';
        let cBodyMid = '#D50000';
        let cBodyBot = '#B71C1C';

        if (isFlashing) {
            cBodyTop = '#FFFF00';
            cBodyMid = '#FF9100';
            cBodyBot = '#FF3D00';
        } else if (progress > 0.4) {
            cBodyTop = '#FF5252';
            cBodyMid = '#FF1744';
            cBodyBot = '#C62828';
        }

        // Curved Pepper Body Path
        ctx.beginPath();
        ctx.moveTo(-13, -16);
        ctx.bezierCurveTo(-22, -4, -18, 14, -3, 27);
        ctx.quadraticCurveTo(2, 29, 4, 25);
        ctx.bezierCurveTo(18, 12, 17, -4, 11, -16);
        ctx.closePath();

        const grad = ctx.createLinearGradient(-15, -16, 15, 25);
        grad.addColorStop(0, cBodyTop);
        grad.addColorStop(0.45, cBodyMid);
        grad.addColorStop(1, cBodyBot);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = isFlashing ? '#FFEA00' : '#880E4F';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 3D Pepper highlight streak
        ctx.strokeStyle = isFlashing ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-9, -10);
        ctx.bezierCurveTo(-14, -2, -12, 10, -3, 19);
        ctx.stroke();

        // Stem & Calyx (Green Leafy Cap on top)
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#2E7D32';
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;

        // Leafy cap prongs
        ctx.beginPath();
        ctx.moveTo(-14, -15);
        ctx.lineTo(-7, -22);
        ctx.lineTo(0, -16);
        ctx.lineTo(7, -22);
        ctx.lineTo(13, -15);
        ctx.quadraticCurveTo(0, -12, -14, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Stalk sticking up and curving left
        ctx.beginPath();
        ctx.moveTo(-1, -18);
        ctx.quadraticCurveTo(-6, -28, -10, -31);
        ctx.strokeStyle = '#33691E';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Furious Angry Face!
        const eyeY = -4;
        ctx.fillStyle = '#FFFFFF';
        // Left eye
        ctx.beginPath();
        ctx.ellipse(-5.5, eyeY, 4, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Right eye
        ctx.beginPath();
        ctx.ellipse(4.5, eyeY, 4, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupils - fiery focused glare
        ctx.fillStyle = isFlashing ? '#D50000' : '#000000';
        ctx.beginPath();
        ctx.arc(-4.5, eyeY + 0.5, 2, 0, Math.PI * 2);
        ctx.arc(3.5, eyeY + 0.5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Furious V-shaped slanted Eyebrows
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-10.5, eyeY - 7);
        ctx.lineTo(-2, eyeY - 3.5);
        ctx.moveTo(9.5, eyeY - 7);
        ctx.lineTo(1, eyeY - 3.5);
        ctx.stroke();

        // Clenched Teeth Grimace / Fiery Mouth
        ctx.fillStyle = '#1B0000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-7, 7, 14, 6, 2);
        } else {
            ctx.rect(-7, 7, 14, 6);
        }
        ctx.fill();
        ctx.stroke();

        // Clenched white teeth dividers
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-6, 8, 12, 4);
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-6, 10);
        ctx.lineTo(6, 10);
        ctx.moveTo(-2, 8);
        ctx.lineTo(-2, 12);
        ctx.moveTo(2, 8);
        ctx.lineTo(2, 12);
        ctx.stroke();

        ctx.restore();
    }
}

// ----------------------------------------------------
// POTATO MINE (LAND MINE WITH RED BLINKING ANTENNA)
// ----------------------------------------------------
class PotatoMine {
    constructor(x, y, lane = 0) {
        this.x = x;
        this.y = y;
        this.lane = lane;
        this.animTime = Math.random() * 10;
        this.blinkTimer = 0;
        this.blinkState = true;
        this.dead = false;
        this.isArmed = true; // ready to detonate when stepped on
        this.scale = 1.0;
    }

    update(dt) {
        this.animTime += dt;
        this.blinkTimer += dt;
        // Blinking red antenna bulb (toggles every 0.28s)
        if (this.blinkTimer >= 0.28) {
            this.blinkTimer = 0;
            this.blinkState = !this.blinkState;
        }
    }

    render(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 26, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1. Dirt clods / soil mound circling the base
        const dirtColors = ['#4E342E', '#5D4037', '#6D4C41', '#3E2723'];
        const clodPositions = [
            [-22, 13, 5], [-16, 15, 6], [-9, 16, 6.5], [0, 17, 7],
            [9, 16, 6.5], [16, 15, 6], [22, 13, 5],
            [-18, 10, 4.5], [18, 10, 4.5]
        ];
        clodPositions.forEach(([cx, cy, cr], idx) => {
            ctx.fillStyle = dirtColors[idx % dirtColors.length];
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
        });

        // 2. Potato Dome Body
        const potatoGrad = ctx.createRadialGradient(0, -2, 4, 0, 6, 25);
        potatoGrad.addColorStop(0, '#FFE082'); // bright golden highlight
        potatoGrad.addColorStop(0.4, '#D7CCC8'); // soft tan
        potatoGrad.addColorStop(0.85, '#A1887F'); // rich potato brown
        potatoGrad.addColorStop(1, '#6D4C41'); // shadow rim

        ctx.fillStyle = potatoGrad;
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 2.5;

        // Semi-elliptical potato dome
        ctx.beginPath();
        ctx.moveTo(-22, 14);
        ctx.quadraticCurveTo(-24, -2, 0, -4);
        ctx.quadraticCurveTo(24, -2, 22, 14);
        ctx.quadraticCurveTo(0, 18, -22, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Potato skin freckles / texture spots
        ctx.fillStyle = 'rgba(93, 64, 55, 0.45)';
        const freckles = [[-12, 2, 1.2], [-6, -1, 1], [8, 1, 1.3], [14, 5, 1], [-3, 6, 1.2]];
        freckles.forEach(([fx, fy, fr]) => {
            ctx.beginPath();
            ctx.arc(fx, fy, fr, 0, Math.PI * 2);
            ctx.fill();
        });

        // 3. Cute Face
        // Eyes
        ctx.fillStyle = '#111111';
        // Left eye
        ctx.beginPath();
        ctx.ellipse(-7, 6, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.beginPath();
        ctx.ellipse(7, 6, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye specular highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-8, 4.5, 1.4, 0, Math.PI * 2);
        ctx.arc(6, 4.5, 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Cheeky Smile line
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-5, 12);
        ctx.quadraticCurveTo(0, 14.5, 6, 11);
        ctx.stroke();

        // Two cute white buck teeth hanging down
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1.2;
        // Left buck tooth
        roundRect(ctx, -2.5, 13, 3, 4, 1);
        ctx.fill();
        ctx.stroke();
        // Right buck tooth
        roundRect(ctx, 1, 12.8, 3, 4, 1);
        ctx.fill();
        ctx.stroke();

        // 4. Antenna Stalk
        ctx.fillStyle = '#CFD8DC';
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = 1.8;
        // Metal base ring
        ctx.beginPath();
        ctx.ellipse(0, -4, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Metal rod sticking straight up
        ctx.beginPath();
        ctx.rect(-2, -18, 4, 14);
        ctx.fill();
        ctx.stroke();

        // 5. Antenna Blinking Red Bulb
        const bulbY = -22;
        const bulbRadius = 6.5;

        if (this.blinkState) {
            // Bright neon blinking red glow
            ctx.shadowColor = '#FF1744';
            ctx.shadowBlur = 16;

            const glowGrad = ctx.createRadialGradient(-1.5, bulbY - 1.5, 1, 0, bulbY, bulbRadius);
            glowGrad.addColorStop(0, '#FFFFFF');
            glowGrad.addColorStop(0.3, '#FF8A80');
            glowGrad.addColorStop(0.7, '#FF1744');
            glowGrad.addColorStop(1, '#D50000');

            ctx.fillStyle = glowGrad;
            ctx.strokeStyle = '#B71C1C';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, bulbY, bulbRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Outer pulse aura ring
            ctx.strokeStyle = 'rgba(255, 23, 68, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, bulbY, bulbRadius + 3.5, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Dark red state when off
            ctx.shadowBlur = 0;
            const darkGrad = ctx.createRadialGradient(-1.5, bulbY - 1.5, 1, 0, bulbY, bulbRadius);
            darkGrad.addColorStop(0, '#EF5350');
            darkGrad.addColorStop(0.5, '#C62828');
            darkGrad.addColorStop(1, '#4A0000');

            ctx.fillStyle = darkGrad;
            ctx.strokeStyle = '#2B0000';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, bulbY, bulbRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
}

