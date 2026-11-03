// Original Cosmos vector artwork; Ashwing wing motion is retargeted separately.
export const DRAGON_DURATION=1250;
export function dragonArtwork(id='cosmos-dragon',texture='/assets/roll-fx/galaxy-nebula.webp'){
 const body='M68 442C116 530 192 564 261 527C313 499 344 432 409 409C440 394 460 378 493 359C540 332 583 338 622 324C655 311 679 290 712 281L744 265L755 250C754 231 737 214 733 196C764 209 782 226 792 247L803 237L800 212C819 225 829 240 832 252L858 253L890 268L925 284L910 297L871 292L846 303L862 315L850 327L813 313L789 319L761 308C710 327 678 375 620 392C576 405 550 434 505 439C457 447 426 438 394 455C341 481 321 540 255 565C172 598 91 543 68 442Z';
 const upper='M513 375C479 345 451 313 436 273L421 199L428 63L390 102C338 124 305 117 269 102L225 109L147 160L89 228C139 199 177 186 200 198C201 241 226 273 270 296C251 262 268 240 294 246C313 299 342 328 383 347C365 318 390 306 410 321L469 409Z';
 const lower='M529 388C492 418 465 451 448 492L429 552L399 748L366 687C323 649 284 644 242 654L204 628L128 553L84 473C136 511 171 531 199 526C208 484 238 469 285 466C257 488 263 510 287 519C320 480 354 463 395 463C371 484 390 500 415 490L489 408Z';
 const limbs='M574 399L627 419L647 452L662 456L659 442L674 459L689 456L680 442L694 446L684 430L655 429L642 400L609 379ZM455 425L425 472L448 500L465 510L459 490L478 504L490 499L475 483L491 489L496 480L463 470L486 441Z';
 const spines='M511 350L522 322L539 338L555 310L571 333L593 305L602 326L626 299L634 317L658 290L666 302L693 275L700 288L705 306L635 350L545 375L510 365Z';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" class="galaxy-dragon-art" aria-hidden="true"><defs>
 <mask id="${id}-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="800"><g fill="white"><g class="galaxy-wing-upper"><path d="${upper}"/></g><g class="galaxy-wing-lower"><path d="${lower}"/></g><path d="${body}"/><path d="${limbs}"/><path d="${spines}"/></g></mask>
 <radialGradient id="${id}-nebula"><stop stop-color="#8057bd"/><stop offset=".42" stop-color="#292064"/><stop offset="1" stop-color="#050a20"/></radialGradient>
 <filter id="${id}-glow" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur stdDeviation="5"/></filter>
 </defs><g filter="url(#${id}-glow)" opacity=".45"><g mask="url(#${id}-mask)"><rect width="1000" height="800" fill="#9585f6"/></g></g>
 <g mask="url(#${id}-mask)"><rect width="1000" height="800" fill="url(#${id}-nebula)"/><image class="galaxy-dragon-texture" href="${texture}" x="-220" y="-160" width="1500" height="1150" preserveAspectRatio="xMidYMid slice"/></g>
 </svg>`;
}
