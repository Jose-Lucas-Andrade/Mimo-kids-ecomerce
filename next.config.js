const nextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next' : process.env.NEXT_DIST_DIR || '.next-build',
};

export default nextConfig;
