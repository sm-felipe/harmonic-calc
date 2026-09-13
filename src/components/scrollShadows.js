// Shadows that appear at the edges of a horizontally scrolling box while
// there is content hidden on that side, so people notice they can scroll.
// The two white "covers" scroll with the content (`local`) and hide the two
// fixed shadows when the corresponding edge is reached.
const scrollShadows = {
    backgroundImage: [
        'linear-gradient(to right, #fff 30%, rgba(255, 255, 255, 0))',
        'linear-gradient(to left, #fff 30%, rgba(255, 255, 255, 0))',
        'radial-gradient(farthest-side at 0 50%, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0))',
        'radial-gradient(farthest-side at 100% 50%, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0))',
    ].join(', '),
    backgroundPosition: 'left center, right center, left center, right center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '40px 100%, 40px 100%, 12px 100%, 12px 100%',
    backgroundAttachment: 'local, local, scroll, scroll',
};

export default scrollShadows;
